"use client";
import { Chessboard } from "react-chessboard";

export function PositionBoard({ fen, uci, selected, orientation, onMove, onSquare }: {
  fen: string; uci?: string; selected: string | null; orientation: "white" | "black";
  onMove: (from: string, to: string) => boolean; onSquare: (square: string) => void;
}) {
  return <div className="board" aria-label="Chess position">
    <Chessboard options={{
      id: "stockfih-board", position: fen, boardOrientation: orientation,
      animationDurationInMs: 0, allowDragging: true, allowDrawingArrows: false,
      onPieceDrop: ({ sourceSquare, targetSquare }) => targetSquare ? onMove(sourceSquare, targetSquare) : false,
      onSquareClick: ({ square }) => onSquare(square),
      darkSquareStyle: { backgroundColor: "var(--board-dark)" },
      lightSquareStyle: { backgroundColor: "var(--board-light)" },
      squareStyles: selected ? { [selected]: { backgroundColor: "var(--selection)" } } : {},
      arrows: uci ? [{ startSquare: uci.slice(0, 2), endSquare: uci.slice(2, 4), color: "var(--arrow)" }] : [],
    }} />
  </div>;
}
