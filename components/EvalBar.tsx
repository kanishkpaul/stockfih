import { formatEval, scoreToBarPercentage } from "@/lib/classify";
import type { EngineScore } from "@/lib/types";

type EvalBarProps = {
  score: EngineScore | null;
};

export function EvalBar({ score }: EvalBarProps) {
  const whiteShare = scoreToBarPercentage(score);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-64 w-12 overflow-hidden rounded-full border border-white/10 bg-slate-950/90">
        <div
          className="absolute inset-x-0 top-0 bg-slate-50 transition-all duration-300"
          style={{ height: `${whiteShare}%` }}
        />
        <div
          className="absolute inset-x-0 bottom-0 bg-slate-900 transition-all duration-300"
          style={{ height: `${100 - whiteShare}%` }}
        />
      </div>
      <div className="space-y-2 text-sm">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-white">
          {formatEval(score)}
        </div>
        <p className="text-slate-400">White</p>
        <p className="text-slate-500">Black</p>
      </div>
    </div>
  );
}
