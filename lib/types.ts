import type { Color } from "chess.js";

export type MoveClassification =
  | "Best"
  | "Excellent"
  | "Good"
  | "Inaccuracy"
  | "Mistake"
  | "Blunder"
  | "Allows mate"
  | "Unavailable";

export type EngineScore = {
  type: "cp" | "mate";
  value: number;
  winner?: Color;
};

export type Wdl = { win: number; draw: number; loss: number };
export type Terminal = { kind: "mate"; winner: Color } | { kind: "draw"; reason: string };

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
  wdl?: Wdl;
  bound?: "exact" | "lower" | "upper";
};

export type PositionAnalysis = {
  fen: string;
  depth: number;
  evaluation: EngineScore | null;
  bestMoveUci: string | null;
  bestMoveSan: string | null;
  lines: EngineLine[];
  wdl?: Wdl;
  terminal?: Terminal;
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
  expectedLoss?: number | null;
};
