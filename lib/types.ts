import type { Color } from "chess.js";

export type MoveClassification =
  | "Brilliant"
  | "Great"
  | "Best"
  | "Excellent"
  | "Good"
  | "Inaccuracy"
  | "Mistake"
  | "Blunder";

export type ExplainTone = "default" | "1200" | "tactical";

export type EngineScore = {
  type: "cp" | "mate";
  value: number;
};

export type ParsedGameMove = {
  id: string;
  index: number;
  ply: number;
  moveNumber: number;
  color: Color;
  san: string;
  lan: string;
  from: string;
  to: string;
  promotion?: string;
  captured?: string;
  beforeFen: string;
  afterFen: string;
  isCapture: boolean;
  isCheck: boolean;
  isMate: boolean;
  isCastle: boolean;
};

export type ParsedGame = {
  headers: Record<string, string>;
  initialFen: string;
  moves: ParsedGameMove[];
  pgn: string;
};

export type EngineLine = {
  multipv: number;
  depth: number;
  score: EngineScore | null;
  uci: string | null;
  san: string | null;
  pv: string[];
};

export type PositionAnalysis = {
  fen: string;
  depth: number;
  evaluation: EngineScore | null;
  bestMoveUci: string | null;
  bestMoveSan: string | null;
  lines: EngineLine[];
};

export type MoveAnalysis = {
  move: ParsedGameMove;
  bestMoveUci: string | null;
  bestMoveSan: string | null;
  evalBefore: EngineScore | null;
  evalAfter: EngineScore | null;
  evalSwing: number | null;
  lossCp: number | null;
  classification: MoveClassification;
  alternatives: EngineLine[];
};

export type ExplanationResult = {
  text: string;
  tone: ExplainTone;
  source: "huggingface" | "template";
  model?: string;
  createdAt: number;
};

export type ExplainRoutePayload = {
  fen: string;
  playedMove: string;
  bestMove: string | null;
  evalBefore: EngineScore | null;
  evalAfter: EngineScore | null;
  classification: MoveClassification;
  pgnContext: string;
  tone: ExplainTone;
};
