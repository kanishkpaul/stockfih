import type {
  EngineScore,
  MoveAnalysis,
  MoveClassification,
  ParsedGameMove,
  PositionAnalysis,
  Wdl,
} from "@/lib/types";

function expected(score: EngineScore | null, wdl?: Wdl) {
  if (score?.type === "mate") return (score.winner ?? (score.value > 0 ? "w" : "b")) === "w" ? 1 : 0;
  return wdl ? (wdl.win + wdl.draw / 2) / 1000 : null;
}

export function classifyMove(
  move: ParsedGameMove,
  evalBefore: EngineScore | null, evalAfter: EngineScore | null,
  beforeWdl?: Wdl, afterWdl?: Wdl,
) {
  const before = expected(evalBefore, beforeWdl);
  const after = expected(evalAfter, afterWdl);
  const expectedLoss = before === null || after === null ? null
    : Math.max(0, move.color === "w" ? before - after : after - before);
  const lossCp = evalBefore?.type === "cp" && evalAfter?.type === "cp"
    ? Math.max(0, (evalBefore.value - evalAfter.value) * (move.color === "w" ? 1 : -1)) : null;
  let classification: MoveClassification = "Unavailable";
  if (expectedLoss !== null) {
    classification = expectedLoss <= 0.01 ? "Best" : expectedLoss <= 0.03 ? "Excellent"
      : expectedLoss <= 0.07 ? "Good" : expectedLoss <= 0.12 ? "Inaccuracy"
      : expectedLoss <= 0.20 ? "Mistake" : "Blunder";
    if (evalAfter?.type === "mate" && expectedLoss > 0 &&
        (evalAfter.winner ?? (evalAfter.value > 0 ? "w" : "b")) !== move.color) classification = "Allows mate";
  }
  return { classification, lossCp, evalSwing: lossCp, expectedLoss };
}

export function buildMoveAnalysis(
  move: ParsedGameMove,
  before: PositionAnalysis | undefined,
  after: PositionAnalysis | undefined,
): MoveAnalysis {
  const { classification, lossCp, evalSwing, expectedLoss } = classifyMove(
    move,
    before?.evaluation ?? null,
    after?.evaluation ?? null,
    before?.wdl, after?.wdl,
  );

  return {
    move,
    bestMoveUci: before?.bestMoveUci ?? null,
    bestMoveSan: before?.bestMoveSan ?? null,
    evalBefore: before?.evaluation ?? null,
    evalAfter: after?.evaluation ?? null,
    evalSwing,
    expectedLoss,
    lossCp,
    classification,
    alternatives:
      before?.lines.filter((line) => line.uci && line.uci !== before.bestMoveUci).slice(0, 2) ?? [],
  };
}

export function formatEval(score: EngineScore | null) {
  if (!score) {
    return "N/A";
  }

  if (score.type === "mate") {
    if (score.value === 0) return score.winner === "w" ? "1–0" : "0–1";
    return `${score.value >= 0 ? "" : "-"}M${Math.abs(score.value)}`;
  }

  const pawns = score.value / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

export function formatEvalLong(score: EngineScore | null) {
  if (!score) {
    return "No engine score yet";
  }

  if (score.type === "mate") {
    if (score.value === 0) return `${score.winner === "w" ? "White" : "Black"} has delivered checkmate`;
    return score.value >= 0
      ? `White has mate in ${Math.abs(score.value)}`
      : `Black has mate in ${Math.abs(score.value)}`;
  }

  if (score.value === 0) return "Engine evaluation is equal";
  const pawns = Math.abs(score.value / 100).toFixed(1);
  return score.value >= 0
    ? `White is better by ${pawns} pawns`
    : `Black is better by ${pawns} pawns`;
}

export function formatSwing(cp: number | null) {
  if (cp === null) {
    return "N/A";
  }

  return `${(cp / 100).toFixed(2)} pawns`;
}

export function scoreToBarPercentage(score: EngineScore | null) {
  if (!score) return 50;
  if (score.type === "mate") return (score.winner ?? (score.value > 0 ? "w" : "b")) === "w" ? 100 : 0;
  const comparable = score.value;

  const bounded = Math.atan(comparable / 350) / Math.PI + 0.5;
  return Math.max(0, Math.min(100, bounded * 100));
}
