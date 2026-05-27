import { FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type PgnInputProps = {
  error: string | null;
  headers: Record<string, string> | null;
  onLoadGame: () => void;
  onLoadSample: () => void;
  onPgnChange: (value: string) => void;
  pgn: string;
};

export function PgnInput({
  error,
  headers,
  onLoadGame,
  onLoadSample,
  onPgnChange,
  pgn,
}: PgnInputProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-cyan-200" />
              PGN Intake
            </CardTitle>
            <CardDescription>
              Paste a PGN, load the sample game, and let Stockfih turn raw engine
              output into coaching.
            </CardDescription>
          </div>
          <Button size="sm" variant="secondary" onClick={onLoadSample}>
            <Sparkles className="mr-2 size-4" />
            Load sample game
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={pgn}
          onChange={(event) => onPgnChange(event.target.value)}
          placeholder={`[Event "Club Night"]\n1. e4 e5 2. Nf3 ...`}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            Supports headers, SAN move text, and standard result tags.
          </div>
          <Button onClick={onLoadGame}>Load Game</Button>
        </div>
        {error ? (
          <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
            {error}
          </div>
        ) : null}
        {headers ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["White", headers.White],
              ["Black", headers.Black],
              ["Event", headers.Event],
              ["Result", headers.Result],
            ].map(
              ([label, value]) =>
                value && (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                  >
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      {label}
                    </div>
                    <div className="mt-1 text-sm text-slate-100">{value}</div>
                  </div>
                ),
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
