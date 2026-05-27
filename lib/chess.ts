import { Chess, type Move as ChessMove } from "chess.js";

import type { ParsedGame, ParsedGameMove } from "@/lib/types";

export const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const SAMPLE_PGN = `[Event "Sample Review Game"]
[Site "Stockfih Demo"]
[Date "2026.05.27"]
[Round "1"]
[White "Aggressive Club Player"]
[Black "Careless Defender"]
[Result "1-0"]
[Opening "Scholar's Mate"]

1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6?? 4. Qxf7# 1-0`;

export function parsePgn(pgn: string): ParsedGame {
  const normalized = pgn.trim();

  if (!normalized) {
    throw new Error("Paste a PGN before loading the game.");
  }

  const chess = new Chess();
  chess.loadPgn(normalized, { strict: false });

  const headers = chess.getHeaders();
  const verboseMoves = chess.history({ verbose: true });

  if (verboseMoves.length === 0) {
    throw new Error("This PGN parsed, but it does not contain any moves.");
  }

  const moves: ParsedGameMove[] = verboseMoves.map((move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const moveUci = uciFromMove(move);

    return {
      id: `${index}-${moveUci}`,
      index,
      ply: index + 1,
      moveNumber,
      color: move.color,
      san: move.san,
      lan: move.lan,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      captured: move.captured,
      beforeFen: move.before,
      afterFen: move.after,
      isCapture: move.isCapture(),
      isCheck: move.san.includes("+") || move.san.includes("#"),
      isMate: move.san.includes("#"),
      isCastle: move.isKingsideCastle() || move.isQueensideCastle(),
    };
  });

  return {
    headers,
    initialFen: moves[0]?.beforeFen ?? new Chess().fen(),
    moves,
    pgn: normalized,
  };
}

export function uciFromMove(
  move: Pick<ChessMove, "from" | "to" | "promotion">,
): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

export function parseUci(uci: string | null) {
  if (!uci || uci.length < 4) {
    return null;
  }

  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
  };
}

export function uciToSan(fen: string, uci: string | null) {
  const parsed = parseUci(uci);

  if (!parsed) {
    return null;
  }

  try {
    const chess = new Chess(fen);
    const move = chess.move(parsed, { strict: true });
    return move.san;
  } catch {
    return null;
  }
}

export function sideToMoveFromFen(fen: string) {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

export function headersSummary(headers: Record<string, string>) {
  const white = headers.White ?? "White";
  const black = headers.Black ?? "Black";
  const result = headers.Result ?? "*";
  const event = headers.Event ?? "Casual game";
  const date = headers.Date ?? "Unknown date";

  return `${white} vs ${black}, ${result}, ${event}, ${date}`;
}

export function buildPgnContext(game: ParsedGame, moveIndex: number) {
  const start = Math.max(0, moveIndex - 3);
  const end = Math.min(game.moves.length, moveIndex + 3);

  const localSequence = game.moves
    .slice(start, end)
    .map((move) =>
      move.color === "w"
        ? `${move.moveNumber}. ${move.san}`
        : `${move.moveNumber}... ${move.san}`,
    )
    .join(" ");

  return `${headersSummary(game.headers)}\nSelected move index: ${moveIndex + 1}\nContext: ${localSequence}`;
}
