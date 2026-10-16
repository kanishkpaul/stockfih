import { Chess } from "chess.js";
import { formatEvalLong } from "@/lib/classify";
import type { MoveComparison, PositionAnalysis } from "@/lib/types";
import type { MoveEvidence } from "@/src/core/interpretation";

/** A comparison always searches the same root twice; it is not a next-position score subtraction. */
export function comparisonFacts(comparison: MoveComparison, target: MoveEvidence): string[] {
  if (comparison.fen !== target.fen || comparison.uci !== target.uci) return [];
  const { unrestricted, restricted } = comparison;
  const board = new Chess(target.fen);
  const selected = board.move(target.uci).san;
  const reply = restricted.lines[0]?.pv[1];
  const replySan = reply ? board.move(reply).san : null;
  return [
    `At the same root and requested depth ${unrestricted.provenance?.requestedDepth}, unrestricted Stockfish prefers ${unrestricted.bestMoveSan ?? "no move"} (${formatEvalLong(unrestricted.evaluation)}).`,
    `Restricting the root to ${selected} produces ${formatEvalLong(restricted.evaluation)}. Both scores use White's perspective; finite-depth searches can differ.`,
    ...(replySan ? [`After ${selected}, Stockfish's searched opponent reply is ${replySan}; this is a continuation, not a guaranteed response.`] : []),
  ];
}

export function traceExport(position: PositionAnalysis, comparison: MoveComparison | null) {
  if (!position.provenance) throw new Error("This analysis has no build provenance. Analyze again.");
  return JSON.stringify({ schema: "stockfih.search-trace.v1", perspective: "white", position,
    comparison, limits: "Finite-depth search evidence; not causal network attribution or a guarantee of play." }, null, 2);
}
