import { BrainCircuit } from "lucide-react";

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
import { MoveInspector } from "@/components/MoveInspector";
import { formatEval, formatSwing } from "@/lib/classify";
import type {
  PositionAnalysis,
  MoveAnalysis,
  ParsedGameMove,
} from "@/lib/types";

type AnalysisPanelProps = {
  analysisError: string | null;
  analysisProgress: {
    completed: number;
    currentMove: string;
    total: number;
  };
  analysisStatus: "idle" | "loading" | "done" | "error";
  depth: 8 | 10 | 12 | 14;
  onAnalyze: () => void;
  onCancel: () => void;
  onChangeDepth: (depth: 8 | 10 | 12 | 14) => void;
  currentPositionAnalysis: PositionAnalysis | null;
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
  analysisError,
  analysisProgress,
  analysisStatus,
  depth,
  onAnalyze,
  onCancel,
  onChangeDepth,
  selectedAnalysis,
  selectedMove,
  currentPositionAnalysis,
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
              Stockfish scores, candidate lines and checked move evidence.
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
            {analysisStatus === "loading" && <Button variant="secondary" onClick={onCancel}>Cancel analysis</Button>}
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
            Select a game move, or inspect Stockfish’s candidate lines below.
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

          </>
        )}
        <Separator />
        <MoveInspector position={currentPositionAnalysis} played={selectedMove} />
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
