import { Chess } from "chess.js";
import * as engine from "@/public/stockfish/manifest.json";
import { parseInfo, positionResult } from "@/src/core/uci";
import type { EngineLine, PositionAnalysis, SearchFrame } from "@/lib/types";

type Gate = { word: string; resolve: () => void; reject: (error: Error) => void; clean: () => void };
type Search = {
  fen: string; depth: number; rootMove: string | null; lines: Map<number, EngineLine>; frames: Map<number, SearchFrame>;
  resolve: (analysis: PositionAnalysis) => void; reject: (error: Error) => void;
  clean: () => void;
};

/** One serialized UCI lane. Cancellation retires the worker so late output cannot cross jobs. */
export class StockfishClient {
  private worker: Worker | null = null;
  private initialization: Promise<void> | null = null;
  private gate: Gate | null = null;
  private search: Search | null = null;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly spawn: () => Worker = () => new Worker("/stockfish/stockfish-18-lite-single.js")) {}

  private retire(error: Error) {
    const worker = this.worker;
    this.worker = null;
    this.initialization = null;
    worker?.terminate();
    const gate = this.gate;
    this.gate = null;
    gate?.clean();
    gate?.reject(error);
    const search = this.search;
    this.search = null;
    search?.clean();
    search?.reject(error);
  }

  dispose() { this.retire(new DOMException("Engine cancelled.", "AbortError")); }

  private deadline(signal: AbortSignal | undefined, ms: number, label: string) {
    const abort = () => this.retire(new DOMException("Engine cancelled.", "AbortError"));
    const timer = setTimeout(() => this.retire(new Error(`${label} timed out. Retry the analysis.`)), ms);
    signal?.addEventListener("abort", abort, { once: true });
    return () => { clearTimeout(timer); signal?.removeEventListener("abort", abort); };
  }

  private acknowledge(command: string, word: string, signal?: AbortSignal) {
    signal?.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      this.gate = { word, resolve, reject, clean: this.deadline(signal, 15_000, "Engine readiness") };
      this.worker!.postMessage(command);
    });
  }

  private async ready(signal?: AbortSignal) {
    if (!this.initialization) {
      this.initialization = this.initialize(signal);
    }
    const initialization = this.initialization;
    try { await initialization; }
    catch (error) {
      if (this.initialization === initialization) this.initialization = null;
      throw error;
    }
  }

  private async initialize(signal?: AbortSignal) {
    try {
      const worker = this.spawn();
      this.worker = worker;
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (this.worker !== worker || typeof event.data !== "string") return;
        try {
          for (const line of event.data.trim().split(/\r?\n/)) this.consume(line);
        } catch {
          this.retire(new Error("Invalid engine output. Retry the analysis."));
        }
      });
      worker.addEventListener("error", () => {
        if (this.worker === worker) this.retire(new Error("Stockfish worker failed. Retry the analysis."));
      });
      await this.acknowledge("uci", "uciok", signal);
      await this.acknowledge("isready", "readyok", signal);
    } catch (error) {
      this.retire(error instanceof Error ? error : new Error("Engine initialization failed."));
      throw error;
    }
  }

  private enqueue<T>(signal: AbortSignal | undefined, run: () => Promise<T>): Promise<T> {
    const job = this.queue.then(async () => {
      signal?.throwIfAborted();
      await this.ready(signal);
      signal?.throwIfAborted();
      return run();
    });
    this.queue = job.then(() => {}, () => {});
    return job;
  }

  newGame(signal?: AbortSignal) {
    return this.enqueue(signal, async () => {
      this.worker!.postMessage("ucinewgame");
      await this.acknowledge("isready", "readyok", signal);
    });
  }

  analyzePosition(fen: string, depth: number, signal?: AbortSignal, rootMove: string | null = null): Promise<PositionAnalysis> {
    const board = new Chess(fen);
    if (!Number.isInteger(depth) || depth < 1 || depth > 24) return Promise.reject(new Error("Depth must be 1–24."));
    if (rootMove && !board.moves({ verbose: true }).some(move => move.lan === rootMove)) return Promise.reject(new Error("Comparison move is illegal."));
    return this.enqueue(signal, () => new Promise<PositionAnalysis>((resolve, reject) => {
      this.search = { fen, depth, rootMove, frames: new Map(), lines: new Map(), resolve, reject, clean: this.deadline(signal, 60_000, "Engine search") };
      this.worker!.postMessage("setoption name Threads value 1");
      this.worker!.postMessage("setoption name Hash value 16");
      this.worker!.postMessage("setoption name MultiPV value 3");
      this.worker!.postMessage("setoption name UCI_ShowWDL value true");
      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${depth}${rootMove ? ` searchmoves ${rootMove}` : ""}`);
    }));
  }

  private consume(line: string) {
    if (this.gate?.word === line) {
      const gate = this.gate;
      this.gate = null;
      gate.clean();
      gate.resolve();
      return;
    }
    const pending = this.search;
    if (!pending) return;
    if (line.startsWith("info ")) {
      const parsed = parseInfo(line, pending.fen);
      if (parsed) {
        pending.lines.set(parsed.multipv, parsed);
        const frame = pending.frames.get(parsed.depth) ?? { depth: parsed.depth, lines: [], nodes: 0, milliseconds: 0 };
        frame.lines = [...frame.lines.filter(previous => previous.multipv !== parsed.multipv), parsed].sort((a, b) => a.multipv - b.multipv);
        frame.nodes = Number(line.match(/ nodes (\d+)/)?.[1] ?? frame.nodes);
        frame.milliseconds = Number(line.match(/ time (\d+)/)?.[1] ?? frame.milliseconds);
        pending.frames.set(parsed.depth, frame);
      }
    }
    if (line.startsWith("bestmove ")) {
      this.search = null;
      pending.clean();
      const uci = line.split(/\s+/)[1];
      const best = uci === "(none)" || uci === "0000" ? null : uci;
      const lines = [...pending.lines.values()].sort((a, b) => a.multipv - b.multipv);
      pending.resolve({ ...positionResult(pending.fen, lines, best),
        trace: [...pending.frames.values()].sort((a, b) => a.depth - b.depth),
        provenance: { engine, requestedDepth: pending.depth, multiPv: 3, threads: 1, hashMb: 16, showWdl: true, rootMove: pending.rootMove },
      });
    }
  }
}

let client: StockfishClient | null = null;
export function getStockfishClient() { return client ??= new StockfishClient(); }
