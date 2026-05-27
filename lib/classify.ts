import type {
  EngineScore,
  MoveAnalysis,
  MoveClassification,
  ParsedGameMove,
  PositionAnalysis,
} from "@/lib/types";

const MATE_SCORE = 100_000;

export function scoreToComparable(score: EngineScore | null) {
  if (!score) {
    return null;
  }

  if (score.type === "cp") {
    return score.value;
  }

  const direction = score.value >= 0 ? 1 : -1;
  return direction * (MATE_SCORE - Math.abs(score.value) * 1_000);
}

function scoreFromMoverPerspective(score: EngineScore | null, color: "w" | "b") {
  const comparable = scoreToComparable(score);

  if (comparable === null) {
    return null;
  }

  return color === "w" ? comparable : -comparable;
}

export function classifyMove(
  move: ParsedGameMove,
  bestMoveUci: string | null,
  evalBefore: EngineScore | null,
  evalAfter: EngineScore | null,
) {
  const moverBefore = scoreFromMoverPerspective(evalBefore, move.color);
  const moverAfter = scoreFromMoverPerspective(evalAfter, move.color);

  const lossCp =
    moverBefore === null || moverAfter === null
      ? null
      : Math.max(0, moverBefore - moverAfter);

  let classification: MoveClassification;

  if (lossCp === null) {
    classification = bestMoveUci === `${move.from}${move.to}${move.promotion ?? ""}` ? "Best" : "Good";
  } else if (lossCp <= 15) {
    classification = "Best";
  } else if (lossCp <= 35) {
    classification = "Excellent";
  } else if (lossCp <= 70) {
    classification = "Good";
  } else if (lossCp <= 130) {
    classification = "Inaccuracy";
  } else if (lossCp <= 250) {
    classification = "Mistake";
  } else {
    classification = "Blunder";
  }

  const playedMoveUci = `${move.from}${move.to}${move.promotion ?? ""}`;

  if (playedMoveUci === bestMoveUci && classification === "Best") {
    if (move.isMate) {
      classification = "Brilliant";
    } else if (move.isCapture || move.isCheck || move.isCastle) {
      classification = "Great";
    }
  }

  return {
    classification,
    lossCp,
    evalSwing: lossCp,
  };
}

export function buildMoveAnalysis(
  move: ParsedGameMove,
  before: PositionAnalysis | undefined,
  after: PositionAnalysis | undefined,
): MoveAnalysis {
  const { classification, lossCp, evalSwing } = classifyMove(
    move,
    before?.bestMoveUci ?? null,
    before?.evaluation ?? null,
    after?.evaluation ?? null,
  );

  return {
    move,
    bestMoveUci: before?.bestMoveUci ?? null,
    bestMoveSan: before?.bestMoveSan ?? null,
    evalBefore: before?.evaluation ?? null,
    evalAfter: after?.evaluation ?? null,
    evalSwing,
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
    return score.value >= 0
      ? `White has mate in ${Math.abs(score.value)}`
      : `Black has mate in ${Math.abs(score.value)}`;
  }

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
  const comparable = scoreToComparable(score);

  if (comparable === null) {
    return 50;
  }

  const bounded = Math.atan(comparable / 350) / Math.PI + 0.5;
  return Math.max(0, Math.min(100, bounded * 100));
}
