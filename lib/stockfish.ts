"use client";

import { uciToSan } from "@/lib/chess";
import type { EngineLine, EngineScore, PositionAnalysis } from "@/lib/types";

type PendingRequest = {
  depth: number;
  fen: string;
  lines: Map<number, EngineLine>;
  reject: (error: Error) => void;
  resolve: (analysis: PositionAnalysis) => void;
  timer: number;
};

class StockfishClient {
  private initPromise: Promise<void> | null = null;
  private pending: PendingRequest | null = null;
  private readyResolvers: Array<() => void> = [];
  private sawUciOk = false;
  private worker: Worker | null = null;

  constructor(private readonly enginePath: string) {}

  async ensureReady() {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (typeof window === "undefined") {
      throw new Error("Stockfish can only run in the browser.");
    }

    this.initPromise = new Promise<void>(async (resolve, reject) => {
      // Try to fetch the worker file first to provide a clearer error when
      // the asset is missing or served incorrectly.
      try {
        // eslint-disable-next-line no-console
        console.debug("Fetching Stockfish worker:", this.enginePath);
        const resp = await fetch(this.enginePath, { method: "GET" });

        if (!resp.ok) {
          reject(new Error(`Failed to fetch Stockfish worker: ${resp.status} ${resp.statusText}`));
          return;
        }
        // eslint-disable-next-line no-console
        console.debug("Stockfish worker fetched successfully");
      } catch (err) {
        reject(new Error(`Failed to fetch Stockfish worker: ${String(err)}`));
        return;
      }

      let worker: Worker;

      try {
        // eslint-disable-next-line no-console
        console.debug("Constructing Stockfish worker from:", this.enginePath);
        worker = new Worker(this.enginePath);
        // eslint-disable-next-line no-console
        console.debug("Stockfish worker constructed");
      } catch (err) {
        reject(new Error(`Failed to construct Stockfish worker: ${String(err)}`));
        return;
      }

      this.worker = worker;

      const timeout = window.setTimeout(() => {
        reject(new Error("Stockfish took too long to initialize."));
      }, 15_000);

      worker.addEventListener("message", (event) => {
        // Worker may post a string or an object; normalize to a trimmed string.
        let raw = event.data ?? "";
        let line: string;

        try {
          line = typeof raw === "string" ? raw.trim() : JSON.stringify(raw).trim();
        } catch (e) {
          line = String(raw).trim();
        }

        if (!line) {
          return;
        }

        // eslint-disable-next-line no-console
        console.debug("Stockfish worker ->", line);

        if (!this.sawUciOk && line === "uciok") {
          this.sawUciOk = true;
          worker.postMessage("isready");
          return;
        }

        if (line === "readyok") {
          // Prefer resolving any syncReady waiters first (used by newGame/
          // analyzePosition). If there are none, this is likely the initial
          // startup handshake and we should resolve the init promise.
          const resolveReady = this.readyResolvers.shift();
          if (resolveReady) {
            resolveReady();
            return;
          }

          if (this.sawUciOk) {
            window.clearTimeout(timeout);
            resolve();
            return;
          }
        }

        // If the engine prints unexpected content while there is a pending
        // request, still pass it to the consumer for debugging/parsing.
        try {
          this.consumeLine(line);
        } catch (err) {
          // Surface parsing issues to the console for easier debugging.
          // Don't reject here; let the pending request timeout if analysis fails.
          // eslint-disable-next-line no-console
          console.error("Error consuming Stockfish line:", err, line);
        }
      });

      worker.addEventListener("error", (ev) => {
        window.clearTimeout(timeout);
        const message = (ev && (ev as any).message) || "Stockfish worker error";
        reject(new Error(String(message)));
      });

      worker.postMessage("uci");
    });

    return this.initPromise;
  }

  async newGame() {
    await this.ensureReady();
    this.worker?.postMessage("ucinewgame");
    await this.syncReady();
  }

  async analyzePosition(fen: string, depth: number): Promise<PositionAnalysis> {
    await this.ensureReady();
    await this.syncReady();

    if (!this.worker) {
      throw new Error("Stockfish worker is not available.");
    }

    if (this.pending) {
      throw new Error("Stockfish is already analyzing another position.");
    }

    return new Promise<PositionAnalysis>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending = null;
        reject(new Error("Stockfish analysis timed out."));
      }, 25_000);

      this.pending = {
        depth,
        fen,
        lines: new Map<number, EngineLine>(),
        reject,
        resolve,
        timer,
      };

      this.worker?.postMessage("setoption name MultiPV value 3");
      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`go depth ${depth}`);
    });
  }

  private async syncReady() {
    if (!this.worker) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.readyResolvers.push(resolve);
      this.worker?.postMessage("isready");
    });
  }

  private consumeLine(line: string) {
    if (line === "readyok") {
      const resolveReady = this.readyResolvers.shift();
      resolveReady?.();
      return;
    }

    if (!this.pending) {
      return;
    }

    if (line.startsWith("info ")) {
      this.consumeInfoLine(line, this.pending);
      return;
    }

    if (line.startsWith("bestmove")) {
      const pending = this.pending;
      this.pending = null;
      window.clearTimeout(pending.timer);

      const [, bestMove] = line.split(/\s+/);
      const lines = Array.from(pending.lines.values()).sort(
        (left, right) => left.multipv - right.multipv,
      );

      pending.resolve({
        fen: pending.fen,
        depth: pending.depth,
        evaluation: lines[0]?.score ?? null,
        bestMoveUci: bestMove && bestMove !== "(none)" ? bestMove : null,
        bestMoveSan:
          bestMove && bestMove !== "(none)" ? uciToSan(pending.fen, bestMove) : null,
        lines,
      });
    }
  }

  private consumeInfoLine(line: string, pending: PendingRequest) {
    const scoreMatch = line.match(/ score (cp|mate) (-?\d+)/);
    const pvMatch = line.match(/ pv (.+)$/);

    if (!scoreMatch || !pvMatch) {
      return;
    }

    const depthMatch = line.match(/ depth (\d+)/);
    const multiPvMatch = line.match(/ multipv (\d+)/);
    const uciMoves = pvMatch[1].trim().split(/\s+/);
    const firstMove = uciMoves[0] ?? null;
    const sideMultiplier = pending.fen.split(" ")[1] === "b" ? -1 : 1;
    const score: EngineScore = {
      type: scoreMatch[1] as "cp" | "mate",
      value: Number(scoreMatch[2]) * sideMultiplier,
    };

    pending.lines.set(Number(multiPvMatch?.[1] ?? "1"), {
      multipv: Number(multiPvMatch?.[1] ?? "1"),
      depth: Number(depthMatch?.[1] ?? pending.depth),
      score,
      uci: firstMove,
      san: uciToSan(pending.fen, firstMove),
      pv: uciMoves,
    });
  }
}

let client: StockfishClient | null = null;

export function getStockfishClient() {
  if (!client) {
    client = new StockfishClient("/stockfish/stockfish-18-lite-single.js");
  }

  return client;
}
