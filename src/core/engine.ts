import { uciToSan } from "@/lib/chess";
import type { EngineLine, EngineScore, PositionAnalysis } from "@/lib/types";

type Gate = { word: string; resolve: () => void; reject: (error: Error) => void; clean: () => void };
type Search = {
  fen: string; depth: number; lines: Map<number, EngineLine>;
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

  analyzePosition(fen: string, depth: number, signal?: AbortSignal): Promise<PositionAnalysis> {
    return this.enqueue(signal, () => new Promise<PositionAnalysis>((resolve, reject) => {
      this.search = { fen, depth, lines: new Map(), resolve, reject, clean: this.deadline(signal, 60_000, "Engine search") };
      this.worker!.postMessage("setoption name MultiPV value 3");
      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${depth}`);
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
      const scoreMatch = line.match(/ score (cp|mate) (-?\d+)/);
      const pvMatch = line.match(/ pv (.+)$/);
      if (!scoreMatch || !pvMatch) return;
      const pv = pvMatch[1].trim().split(/\s+/);
      const multipv = Number(line.match(/ multipv (\d+)/)?.[1] ?? 1);
      const score: EngineScore = {
        type: scoreMatch[1] as "cp" | "mate",
        value: Number(scoreMatch[2]) * (pending.fen.split(" ")[1] === "b" ? -1 : 1),
      };
      pending.lines.set(multipv, {
        multipv, depth: Number(line.match(/ depth (\d+)/)?.[1] ?? pending.depth), score,
        uci: pv[0], san: uciToSan(pending.fen, pv[0]), pv,
      });
    }
    if (line.startsWith("bestmove ")) {
      this.search = null;
      pending.clean();
      const uci = line.split(/\s+/)[1];
      const best = uci === "(none)" || uci === "0000" ? null : uci;
      const lines = [...pending.lines.values()].sort((a, b) => a.multipv - b.multipv);
      pending.resolve({
        fen: pending.fen, depth: pending.depth, lines, evaluation: lines[0]?.score ?? null,
        bestMoveUci: best, bestMoveSan: uciToSan(pending.fen, best),
      });
    }
  }
}

let client: StockfishClient | null = null;
export function getStockfishClient() { return client ??= new StockfishClient(); }
