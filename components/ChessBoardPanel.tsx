import { ArrowLeft, ArrowRight, FlipHorizontal2 } from "lucide-react";
import { Chessboard } from "react-chessboard";

import { parseUci, sideToMoveFromFen } from "@/lib/chess";
import type { ParsedGame, ParsedGameMove, PositionAnalysis } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChessBoardPanelProps = {
  canGoNext: boolean;
  canGoPrev: boolean;
  currentFen: string;
  currentMove: ParsedGameMove | null;
  currentPositionAnalysis: PositionAnalysis | null;
  game: ParsedGame | null;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  orientation: "white" | "black";
  selectedPly: number;
};

export function ChessBoardPanel({
  canGoNext,
  canGoPrev,
  currentFen,
  currentMove,
  currentPositionAnalysis,
  game,
  onFlip,
  onNext,
  onPrev,
  orientation,
  selectedPly,
}: ChessBoardPanelProps) {
  const lastMoveSquares =
    currentMove && selectedPly > 0
      ? {
          [currentMove.from]: {
            backgroundColor: "rgba(56, 189, 248, 0.18)",
          },
          [currentMove.to]: {
            backgroundColor: "rgba(94, 234, 212, 0.22)",
          },
        }
      : {};

  const bestMove = parseUci(currentPositionAnalysis?.bestMoveUci ?? null);
  const arrows = bestMove
    ? [
        {
          startSquare: bestMove.from,
          endSquare: bestMove.to,
          color: "rgba(94, 234, 212, 0.75)",
        },
      ]
    : [];

  const moveLabel =
    currentMove && selectedPly > 0
      ? `After ${currentMove.color === "w" ? `${currentMove.moveNumber}.` : `${currentMove.moveNumber}...`} ${currentMove.san}`
      : "Start position";

  const sideToMove = sideToMoveFromFen(currentFen) === "w" ? "White" : "Black";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-white/8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Replay Board</CardTitle>
            <div className="mt-2 text-sm text-slate-400">
              {moveLabel} • {sideToMove} to move
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{game?.headers.White ?? "White"}</Badge>
            <Badge variant="neutral">vs</Badge>
            <Badge variant="accent">{game?.headers.Black ?? "Black"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="mx-auto w-full max-w-[620px]">
          <Chessboard
            options={{
              id: "stockfih-board",
              position: currentFen,
              boardOrientation: orientation,
              allowDragging: false,
              arrows,
              squareStyles: lastMoveSquares,
              animationDurationInMs: 220,
              darkSquareStyle: { backgroundColor: "#17304f" },
              lightSquareStyle: { backgroundColor: "#dce9f6" },
              boardStyle: {
                width: "100%",
                borderRadius: "24px",
                boxShadow:
                  "0 24px 60px rgba(2, 6, 23, 0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
              },
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onPrev} disabled={!canGoPrev}>
              <ArrowLeft className="mr-2 size-4" />
              Prev
            </Button>
            <Button variant="secondary" onClick={onNext} disabled={!canGoNext}>
              Next
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
          <Button variant="ghost" onClick={onFlip}>
            <FlipHorizontal2 className="mr-2 size-4" />
            Flip board
          </Button>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-400">
          Last move squares are highlighted in cyan. When analysis is available, the
          arrow shows Stockfish&apos;s best move from the current board position.
        </div>
      </CardContent>
    </Card>
  );
}
