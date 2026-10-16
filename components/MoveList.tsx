import { useEffect, useRef } from "react";
import type { MoveAnalysis, ParsedGameMove } from "@/lib/types";

export function MoveList({ moves, analyses, selectedPly, onSelect }: {
  moves: ParsedGameMove[]; analyses: Record<number, MoveAnalysis>;
  selectedPly: number; onSelect: (ply: number) => void;
}) {
  const current = useRef<HTMLButtonElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!current.current || !scroller.current) return;
    const selected = current.current.getBoundingClientRect();
    const list = scroller.current.getBoundingClientRect();
    if (selected.top < list.top) scroller.current.scrollTop += selected.top - list.top;
    if (selected.bottom > list.bottom) scroller.current.scrollTop += selected.bottom - list.bottom;
  }, [selectedPly]);
  const grouped = new Map<number, { white?: ParsedGameMove; black?: ParsedGameMove }>();
  for (const move of moves) {
    const row = grouped.get(move.moveNumber) ?? {};
    row[move.color === "w" ? "white" : "black"] = move;
    grouped.set(move.moveNumber, row);
  }
  return <div ref={scroller} className="move-scroll" aria-label="Move list">
    <table className="moves"><thead><tr><th>Move</th><th>White</th><th>Black</th></tr></thead>
      <tbody>{[...grouped].map(([number, row]) => <tr key={number}>
        <th scope="row">{number}.</th>
        {[row.white, row.black].map((move, side) => <td key={side}>{move && <button
          ref={move.ply === selectedPly ? current : null}
          aria-current={move.ply === selectedPly ? "step" : undefined}
          onClick={() => onSelect(move.ply)} className={analyses[move.index]?.expectedLoss ? "loss" : ""}
        ><span>{move.san}</span><small>{analyses[move.index]?.classification}</small></button>}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
