"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { MoveList } from "@/components/MoveList";
import { PgnInput } from "@/components/PgnInput";
import { Card, CardContent } from "@/components/ui/card";
import { buildMoveAnalysis } from "@/lib/classify";
import {
  DEFAULT_FEN,
  parsePgn,
  SAMPLE_PGN,
} from "@/lib/chess";
import { getStockfishClient } from "@/lib/stockfish";
import type {
  MoveAnalysis,
  ParsedGame,
  PositionAnalysis,
} from "@/lib/types";

function createInitialGame() {
  try {
    return parsePgn(SAMPLE_PGN);
  } catch {
    return null;
  }
}

export function StockfihApp() {
  const [pgnInput, setPgnInput] = useState(SAMPLE_PGN);
  const [game, setGame] = useState<ParsedGame | null>(() => createInitialGame());
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedPly, setSelectedPly] = useState(0);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState({
    completed: 0,
    currentMove: "Waiting",
    total: 0,
  });
  const [depth, setDepth] = useState<8 | 10 | 12 | 14>(10);
  const [positionAnalyses, setPositionAnalyses] = useState<Record<number, PositionAnalysis>>({});
  const [moveAnalyses, setMoveAnalyses] = useState<Record<number, MoveAnalysis>>({});
  const selectedMove =
    game && selectedPly > 0 ? game.moves[selectedPly - 1] : null;
  const selectedAnalysis =
    selectedMove ? moveAnalyses[selectedMove.index] ?? null : null;
  const currentFen =
    game?.moves[selectedPly - 1]?.afterFen ??
    (selectedPly === 0 ? game?.initialFen : undefined) ??
    DEFAULT_FEN;
  const currentPositionAnalysis = positionAnalyses[selectedPly] ?? null;

  const handleKeyboardNavigation = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;

    if (
      !game ||
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "INPUT" ||
      target?.tagName === "SELECT" ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      target?.isContentEditable
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSelectedPly((current) => Math.min(game.moves.length, current + 1));
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSelectedPly((current) => Math.max(0, current - 1));
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleKeyboardNavigation);
  }, []);

  function resetAnalysisState() {
    setAnalysisStatus("idle");
    setAnalysisError(null);
    setAnalysisProgress({
      completed: 0,
      currentMove: "Waiting",
      total: 0,
    });
    setPositionAnalyses({});
    setMoveAnalyses({});
  }

  function loadGame(rawPgn: string) {
    try {
      const parsed = parsePgn(rawPgn);
      startTransition(() => {
        setGame(parsed);
        setPgnInput(rawPgn);
        setParseError(null);
        setSelectedPly(0);
        resetAnalysisState();
      });
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "The PGN could not be parsed.",
      );
    }
  }

  async function handleAnalyzeGame() {
    if (!game || analysisStatus === "loading") {
      return;
    }

    setAnalysisStatus("loading");
    setAnalysisError(null);
    setPositionAnalyses({});
    setMoveAnalyses({});

    try {
      const client = getStockfishClient();
      const positions = [game.initialFen, ...game.moves.map((move) => move.afterFen)];
      const nextPositionAnalyses: Record<number, PositionAnalysis> = {};
      const nextMoveAnalyses: Record<number, MoveAnalysis> = {};

      await client.newGame();
      setAnalysisProgress({
        completed: 0,
        currentMove: game.moves[0]?.san ?? "Initial position",
        total: positions.length,
      });

      for (let index = 0; index < positions.length; index += 1) {
        setAnalysisProgress({
          completed: index,
          currentMove:
            index < game.moves.length ? game.moves[index].san : "Final position",
          total: positions.length,
        });

        const positionAnalysis = await client.analyzePosition(positions[index], depth);
        nextPositionAnalyses[index] = positionAnalysis;
        setPositionAnalyses({ ...nextPositionAnalyses });

        if (index > 0) {
          const move = game.moves[index - 1];
          nextMoveAnalyses[move.index] = buildMoveAnalysis(
            move,
            nextPositionAnalyses[index - 1],
            nextPositionAnalyses[index],
          );
          setMoveAnalyses({ ...nextMoveAnalyses });
        }
      }

      setAnalysisProgress({
        completed: positions.length,
        currentMove: "Complete",
        total: positions.length,
      });
      setAnalysisStatus("done");
    } catch (error) {
      setAnalysisStatus("error");
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Stockfish failed while analyzing the game.",
      );
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="workspace-header">
          <h1>Stockfih</h1>
          <p>Inspect the game. Follow Stockfish’s lines. Explain the evidence.</p>
        </header>

        <details className="workspace-import">
          <summary>Import a game</summary>
        <PgnInput
          error={parseError}
          headers={game?.headers ?? null}
          onLoadGame={() => loadGame(pgnInput)}
          onLoadSample={() => loadGame(SAMPLE_PGN)}
          onPgnChange={setPgnInput}
          pgn={pgnInput}
        />
        </details>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px_minmax(340px,420px)]">
          <ChessBoardPanel
            canGoNext={Boolean(game) && selectedPly < (game?.moves.length ?? 0)}
            canGoPrev={selectedPly > 0}
            currentFen={currentFen}
            currentMove={selectedMove}
            currentPositionAnalysis={currentPositionAnalysis}
            game={game}
            onFlip={() =>
              setOrientation((current) => (current === "white" ? "black" : "white"))
            }
            onNext={() =>
              setSelectedPly((current) =>
                Math.min(game?.moves.length ?? 0, current + 1),
              )
            }
            onPrev={() => setSelectedPly((current) => Math.max(0, current - 1))}
            orientation={orientation}
            selectedPly={selectedPly}
          />

          <Card className="h-fit xl:sticky xl:top-6">
            <CardContent className="p-5">
              <MoveList
                analyses={moveAnalyses}
                game={game}
                onSelectPly={(ply) => setSelectedPly(ply)}
                selectedPly={selectedPly}
              />
            </CardContent>
          </Card>

          <AnalysisPanel
            analysisError={analysisError}
            analysisProgress={analysisProgress}
            analysisStatus={analysisStatus}
            depth={depth}
            onAnalyze={handleAnalyzeGame}
            onChangeDepth={setDepth}
            selectedAnalysis={selectedAnalysis}
            selectedMove={selectedMove}
            currentPositionAnalysis={currentPositionAnalysis}
          />
        </div>
      </section>
    </main>
  );
}
