"use client";

import { startTransition, useEffect, useEffectEvent, useMemo, useState } from "react";
import { Cpu, Keyboard, ScanSearch } from "lucide-react";

import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ChessBoardPanel } from "@/components/ChessBoardPanel";
import { MoveList } from "@/components/MoveList";
import { PgnInput } from "@/components/PgnInput";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildMoveAnalysis } from "@/lib/classify";
import {
  buildPgnContext,
  DEFAULT_FEN,
  parsePgn,
  SAMPLE_PGN,
} from "@/lib/chess";
import { buildFallbackExplanation } from "@/lib/prompts";
import { getStockfishClient } from "@/lib/stockfish";
import type {
  ExplainTone,
  ExplanationResult,
  MoveAnalysis,
  ParsedGame,
  PositionAnalysis,
} from "@/lib/types";

const EXPLANATION_CACHE_KEY = "stockfih:explanations:v1";

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
  const [explanationCache, setExplanationCache] = useState<Record<string, ExplanationResult>>(
    () => {
      if (typeof window === "undefined") {
        return {};
      }

      try {
        const cached = window.localStorage.getItem(EXPLANATION_CACHE_KEY);
        return cached ? (JSON.parse(cached) as Record<string, ExplanationResult>) : {};
      } catch {
        window.localStorage.removeItem(EXPLANATION_CACHE_KEY);
        return {};
      }
    },
  );
  const [activeTone, setActiveTone] = useState<ExplainTone>("default");
  const [explainingKey, setExplainingKey] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(EXPLANATION_CACHE_KEY, JSON.stringify(explanationCache));
  }, [explanationCache]);

  const selectedMove =
    game && selectedPly > 0 ? game.moves[selectedPly - 1] : null;
  const selectedAnalysis =
    selectedMove ? moveAnalyses[selectedMove.index] ?? null : null;
  const currentFen =
    game?.moves[selectedPly - 1]?.afterFen ??
    (selectedPly === 0 ? game?.initialFen : undefined) ??
    DEFAULT_FEN;
  const currentPositionAnalysis = positionAnalyses[selectedPly] ?? null;

  const explanationKey = selectedMove ? `${selectedMove.id}:${activeTone}` : null;
  const selectedExplanation = explanationKey
    ? explanationCache[explanationKey] ?? null
    : null;

  const handleKeyboardNavigation = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;

    if (
      !game ||
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "INPUT" ||
      target?.isContentEditable
    ) {
      return;
    }

    if (event.key === "ArrowRight") {
      setSelectedPly((current) => Math.min(game.moves.length, current + 1));
    }

    if (event.key === "ArrowLeft") {
      setSelectedPly((current) => Math.max(0, current - 1));
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleKeyboardNavigation);
  }, []);

  const metricCards = useMemo(
    () => [
      {
        icon: Cpu,
        label: "Engine-native review",
        copy: "Client-side Stockfish with per-position eval, best move, and MultiPV alternatives.",
      },
      {
        icon: ScanSearch,
        label: "LLM coaching layer",
        copy: "A protected Hugging Face route translates search output into human explanations.",
      },
      {
        icon: Keyboard,
        label: "Fast replay UX",
        copy: "Arrow-key navigation, board flipping, move selection, progress states, and caching.",
      },
    ],
    [],
  );

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
    setActiveTone("default");
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

  async function handleExplain(tone: ExplainTone) {
    if (!game || !selectedMove || !selectedAnalysis) {
      return;
    }

    setActiveTone(tone);

    const cacheKey = `${selectedMove.id}:${tone}`;

    if (explanationCache[cacheKey]) {
      return;
    }

    const payload = {
      fen: selectedMove.beforeFen,
      playedMove: selectedMove.san,
      bestMove: selectedAnalysis.bestMoveSan,
      evalBefore: selectedAnalysis.evalBefore,
      evalAfter: selectedAnalysis.evalAfter,
      classification: selectedAnalysis.classification,
      pgnContext: buildPgnContext(game, selectedMove.index),
      tone,
    } as const;

    setExplainingKey(cacheKey);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("The explanation route returned an error.");
      }

      const data = (await response.json()) as {
        explanation: string;
        model?: string;
        source: "huggingface" | "template";
      };

      setExplanationCache((current) => ({
        ...current,
        [cacheKey]: {
          createdAt: Date.now(),
          model: data.model,
          source: data.source,
          text: data.explanation,
          tone,
        },
      }));
    } catch {
      setExplanationCache((current) => ({
        ...current,
        [cacheKey]: {
          createdAt: Date.now(),
          source: "template",
          text: buildFallbackExplanation(payload),
          tone,
        },
      }));
    } finally {
      setExplainingKey(null);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">Stockfih</Badge>
                <Badge variant="neutral">Frontier-lab chess analysis</Badge>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Stockfish, but it tells you what you were supposed to see.
              </h1>
              <p className="mt-4 max-w-3xl text-balance text-lg leading-8 text-slate-300">
                Upload a PGN, replay the game on an interactive board, score every
                move with Stockfish, and then ask an LLM coach to translate engine
                truth into human advice.
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {metricCards.map(({ icon: Icon, label, copy }) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/10">
                    <Icon className="size-5 text-cyan-100" />
                  </div>
                  <h2 className="text-base font-semibold text-white">{label}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <PgnInput
          error={parseError}
          headers={game?.headers ?? null}
          onLoadGame={() => loadGame(pgnInput)}
          onLoadSample={() => loadGame(SAMPLE_PGN)}
          onPgnChange={setPgnInput}
          pgn={pgnInput}
        />

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
            activeTone={activeTone}
            analysisError={analysisError}
            analysisProgress={analysisProgress}
            analysisStatus={analysisStatus}
            depth={depth}
            explanation={selectedExplanation}
            explanationLoading={Boolean(
              explanationKey && explainingKey && explanationKey === explainingKey,
            )}
            onAnalyze={handleAnalyzeGame}
            onChangeDepth={setDepth}
            onExplain={handleExplain}
            selectedAnalysis={selectedAnalysis}
            selectedMove={selectedMove}
          />
        </div>
      </section>
    </main>
  );
}
