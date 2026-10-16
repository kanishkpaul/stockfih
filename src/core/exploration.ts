import { Chess } from "chess.js";
import { recordMove } from "@/lib/chess";
import type { ParsedGameMove } from "@/lib/types";

export type Exploration = { fens: string[]; moves: ParsedGameMove[]; cursor: number };
export function explore(fen: string): Exploration {
  if (fen.trim().split(/\s+/).length !== 6) throw new Error("FEN needs six fields.");
  return { fens: [new Chess(fen).fen()], moves: [], cursor: 0 };
}
export function play(exploration: Exploration, uci: string): Exploration {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error("Enter a legal UCI move, for example e2e4 or a7a8n.");
  const board = new Chess(exploration.fens[exploration.cursor]);
  const move = board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  return {
    fens: [...exploration.fens.slice(0, exploration.cursor + 1), board.fen()],
    moves: [...exploration.moves.slice(0, exploration.cursor), recordMove(move, exploration.cursor)],
    cursor: exploration.cursor + 1,
  };
}
