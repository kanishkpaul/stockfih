import type { ParsedGame, MoveAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

type MoveListProps = {
  analyses: Record<number, MoveAnalysis>;
  game: ParsedGame | null;
  onSelectPly: (ply: number) => void;
  selectedPly: number;
};

const moveClassStyles: Record<string, string> = {
  Brilliant: "text-cyan-100 bg-cyan-300/14 border-cyan-300/25",
  Great: "text-sky-100 bg-sky-400/14 border-sky-400/25",
  Best: "text-emerald-100 bg-emerald-400/14 border-emerald-400/25",
  Excellent: "text-emerald-100 bg-emerald-400/10 border-emerald-400/20",
  Good: "text-slate-100 bg-white/8 border-white/12",
  Inaccuracy: "text-amber-100 bg-amber-400/14 border-amber-400/25",
  Mistake: "text-orange-100 bg-orange-400/14 border-orange-400/25",
  Blunder: "text-rose-100 bg-rose-500/14 border-rose-500/25",
};

export function MoveList({
  analyses,
  game,
  onSelectPly,
  selectedPly,
}: MoveListProps) {
  if (!game) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/4 p-6 text-sm text-slate-400">
        Load a PGN to populate the move list.
      </div>
    );
  }

  const rows = [];

  for (let index = 0; index < game.moves.length; index += 2) {
    rows.push({
      moveNumber: Math.floor(index / 2) + 1,
      white: game.moves[index],
      black: game.moves[index + 1],
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Move List
        </div>
        <div className="text-sm text-slate-400">
          {game.headers.Result ?? game.moves.at(-1)?.san ?? "*"}
        </div>
      </div>
      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div
            key={row.moveNumber}
            className="grid grid-cols-[48px_1fr_1fr] gap-2 rounded-2xl border border-white/6 bg-white/4 p-2"
          >
            <div className="flex items-center justify-center font-mono text-xs text-slate-500">
              {row.moveNumber}.
            </div>
            {[row.white, row.black].map((move) => {
              if (!move) {
                return <div key={`${row.moveNumber}-blank`} />;
              }

              const analysis = analyses[move.index];
              const isSelected = selectedPly === move.ply;

              return (
                <button
                  key={move.id}
                  type="button"
                  onClick={() => onSelectPly(move.ply)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition",
                    isSelected
                      ? "border-cyan-300/40 bg-cyan-300/12 text-white"
                      : "border-white/8 bg-slate-950/40 text-slate-200 hover:border-white/18 hover:bg-white/6",
                    analysis ? moveClassStyles[analysis.classification] : "",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{move.san}</span>
                    {analysis ? (
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">
                        {analysis.classification}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
