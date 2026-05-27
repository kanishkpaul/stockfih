import { Bot, BrainCircuit, Sparkles } from "lucide-react";

import { EvalBar } from "@/components/EvalBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEval, formatSwing } from "@/lib/classify";
import type {
  ExplainTone,
  ExplanationResult,
  MoveAnalysis,
  ParsedGameMove,
} from "@/lib/types";

type AnalysisPanelProps = {
  activeTone: ExplainTone;
  analysisError: string | null;
  analysisProgress: {
    completed: number;
    currentMove: string;
    total: number;
  };
  analysisStatus: "idle" | "loading" | "done" | "error";
  depth: 8 | 10 | 12 | 14;
  explanation: ExplanationResult | null;
  explanationLoading: boolean;
  onAnalyze: () => void;
  onChangeDepth: (depth: 8 | 10 | 12 | 14) => void;
  onExplain: (tone: ExplainTone) => void;
  selectedAnalysis: MoveAnalysis | null;
  selectedMove: ParsedGameMove | null;
};

const badgeVariantByClassification = {
  Brilliant: "accent",
  Great: "accent",
  Best: "success",
  Excellent: "success",
  Good: "neutral",
  Inaccuracy: "warning",
  Mistake: "danger",
  Blunder: "danger",
} as const;

export function AnalysisPanel({
  activeTone,
  analysisError,
  analysisProgress,
  analysisStatus,
  depth,
  explanation,
  explanationLoading,
  onAnalyze,
  onChangeDepth,
  onExplain,
  selectedAnalysis,
  selectedMove,
}: AnalysisPanelProps) {
  const progress =
    analysisProgress.total > 0
      ? (analysisProgress.completed / analysisProgress.total) * 100
      : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="size-5 text-cyan-200" />
              Analysis Console
            </CardTitle>
            <CardDescription>
              Engine classifications, eval swing, and AI coaching layered onto the
              selected move.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <label htmlFor="depth" className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Depth
            </label>
            <select
              id="depth"
              className="rounded-lg border border-white/10 bg-slate-950/90 px-2 py-1 text-sm text-slate-100 outline-none"
              value={depth}
              onChange={(event) =>
                onChangeDepth(Number(event.target.value) as 8 | 10 | 12 | 14)
              }
            >
              {[8, 10, 12, 14].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-white/8 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Game analysis
              </div>
              <div className="mt-1 text-sm text-slate-300">
                Analyze every position with in-browser Stockfish.
              </div>
            </div>
            <Button onClick={onAnalyze} disabled={analysisStatus === "loading"}>
              {analysisStatus === "loading" ? "Analyzing..." : "Analyze Game"}
            </Button>
          </div>
          {analysisStatus === "loading" ? (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-slate-400">
                {analysisProgress.completed}/{analysisProgress.total} positions •{" "}
                {analysisProgress.currentMove}
              </div>
            </div>
          ) : null}
          {analysisError ? (
            <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
              {analysisError}
            </div>
          ) : null}
        </div>

        {!selectedMove ? (
          <div className="rounded-3xl border border-dashed border-white/12 bg-white/4 p-6 text-sm text-slate-400">
            Select a move from the list to inspect its classification and generate a
            coaching explanation.
          </div>
        ) : !selectedAnalysis ? (
          <div className="space-y-3 rounded-3xl border border-dashed border-white/12 bg-white/4 p-6">
            <div className="text-sm text-slate-300">
              The move is selected, but the engine review has not been computed yet.
            </div>
            <div className="text-sm text-slate-500">
              Run Analyze Game to classify the move, compute the eval swing, and
              unlock explanations.
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
              <EvalBar score={selectedAnalysis.evalAfter} />
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      badgeVariantByClassification[selectedAnalysis.classification]
                    }
                  >
                    {selectedAnalysis.classification}
                  </Badge>
                  <Badge variant="neutral">
                    {selectedMove.color === "w"
                      ? `${selectedMove.moveNumber}. ${selectedMove.san}`
                      : `${selectedMove.moveNumber}... ${selectedMove.san}`}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Stat label="Played move" value={selectedMove.san} />
                  <Stat
                    label="Best move"
                    value={selectedAnalysis.bestMoveSan ?? "N/A"}
                  />
                  <Stat
                    label="Eval before"
                    value={formatEval(selectedAnalysis.evalBefore)}
                  />
                  <Stat
                    label="Eval after"
                    value={formatEval(selectedAnalysis.evalAfter)}
                  />
                  <Stat
                    label="Eval swing"
                    value={formatSwing(selectedAnalysis.evalSwing)}
                  />
                  <Stat
                    label="Primary alternative"
                    value={selectedAnalysis.alternatives[0]?.san ?? "No extra line"}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={activeTone === "default" ? "default" : "secondary"}
                  onClick={() => onExplain("default")}
                  disabled={explanationLoading}
                >
                  <Bot className="mr-2 size-4" />
                  Explain this move
                </Button>
                <Button
                  size="sm"
                  variant={activeTone === "1200" ? "default" : "secondary"}
                  onClick={() => onExplain("1200")}
                  disabled={explanationLoading}
                >
                  <Sparkles className="mr-2 size-4" />
                  Explain like I&apos;m 1200
                </Button>
                <Button
                  size="sm"
                  variant={activeTone === "tactical" ? "default" : "secondary"}
                  onClick={() => onExplain("tactical")}
                  disabled={explanationLoading}
                >
                  <BrainCircuit className="mr-2 size-4" />
                  Explain tactically
                </Button>
              </div>

              {explanationLoading ? (
                <div className="space-y-3 rounded-3xl border border-white/8 bg-white/4 p-5">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-9/12" />
                </div>
              ) : explanation ? (
                <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">
                      {explanation.source === "huggingface"
                        ? explanation.model ?? "Hugging Face"
                        : "Deterministic fallback"}
                    </Badge>
                    <Badge variant="accent">{activeTone}</Badge>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                    {explanation.text}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/12 bg-white/4 p-5 text-sm text-slate-400">
                  Ask for an explanation to turn the engine verdict into position-aware
                  coaching. If `HF_TOKEN` is unset, Stockfih falls back to a local
                  template.
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}
