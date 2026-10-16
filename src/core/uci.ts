import { Chess } from "chess.js";
import { uciToSan } from "@/lib/chess";
import type { EngineLine, EngineScore, PositionAnalysis, Terminal, Wdl } from "@/lib/types";

export function terminal(fen: string): Terminal | undefined {
  const board = new Chess(fen);
  if (board.isCheckmate()) return { kind: "mate", winner: board.turn() === "w" ? "b" : "w" };
  if (board.isStalemate()) return { kind: "draw", reason: "stalemate" };
  if (board.isInsufficientMaterial()) return { kind: "draw", reason: "insufficient material" };
  if (board.isDrawByFiftyMoves()) return { kind: "draw", reason: "fifty-move rule" };
}

/** Scores and WDL are normalized to White; bounds reverse when Black is to move. */
export function parseInfo(line: string, fen: string): EngineLine | null {
  const match = line.match(/ score (cp|mate) (-?\d+)/);
  const depth = line.match(/ depth (\d+)/);
  if (!match || !depth) return null;
  const black = new Chess(fen).turn() === "b";
  const value = Number(match[2]) * (black ? -1 : 1);
  const score: EngineScore = { type: match[1] as "cp" | "mate", value };
  if (score.type === "mate") {
    const end = terminal(fen);
    score.winner = end?.kind === "mate" ? end.winner : value > 0 ? "w" : "b";
  }
  const pv = line.match(/ pv (.+)$/)?.[1].split(/\s+/) ?? [];
  const rawWdl = line.match(/ wdl (\d+) (\d+) (\d+)/);
  let wdl: Wdl | undefined;
  if (rawWdl) {
    const [win, draw, loss] = rawWdl.slice(1).map(Number);
    if (win + draw + loss !== 1000) throw new Error("Invalid engine WDL totals.");
    wdl = black ? { win: loss, draw, loss: win } : { win, draw, loss };
  }
  let bound: EngineLine["bound"] = line.includes(" lowerbound") ? "lower" : line.includes(" upperbound") ? "upper" : "exact";
  if (black && bound !== "exact") bound = bound === "lower" ? "upper" : "lower";
  return {
    multipv: Number(line.match(/ multipv (\d+)/)?.[1] ?? 1), depth: Number(depth[1]), score,
    uci: pv[0] ?? null, san: uciToSan(fen, pv[0] ?? null), pv, wdl, bound,
  };
}

export function positionResult(fen: string, lines: EngineLine[], best: string | null): PositionAnalysis {
  const end = terminal(fen);
  let evaluation = lines[0]?.score ?? null;
  let wdl = lines[0]?.wdl;
  if (end?.kind === "mate") {
    evaluation = { type: "mate", value: 0, winner: end.winner };
    wdl = end.winner === "w" ? { win: 1000, draw: 0, loss: 0 } : { win: 0, draw: 0, loss: 1000 };
  } else if (end?.kind === "draw") {
    evaluation = { type: "cp", value: 0 }; wdl = { win: 0, draw: 1000, loss: 0 };
  }
  return {
    fen, depth: end ? 0 : Math.max(0, ...lines.map(line => line.depth)), lines,
    evaluation, wdl, terminal: end, bestMoveUci: best, bestMoveSan: uciToSan(fen, best),
  };
}
