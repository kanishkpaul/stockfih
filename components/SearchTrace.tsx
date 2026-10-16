import { formatEval } from "@/lib/classify";
import type { PositionAnalysis } from "@/lib/types";

export function SearchTrace({ position, selected, onSelect }: { position: PositionAnalysis; selected: number | null; onSelect: (depth: number) => void }) {
  let previous: string | null = null;
  return <details className="search-trace"><summary>Search by depth · {position.trace?.length ?? 0} observations</summary>
    <p className="muted">Select a depth to inspect its lines. Scores belong to this root; changes show search instability, not hidden reasoning.</p>
    <div className="trace-scroll"><table><thead><tr><th>Depth</th><th>Preferred move</th><th>White eval</th><th>Nodes</th><th>ms</th></tr></thead><tbody>
      {position.trace?.map(frame => {
        const best = frame.lines[0]; const changed = previous !== null && previous !== best?.uci; previous = best?.uci ?? null;
        return <tr key={frame.depth}><td><button aria-pressed={selected === frame.depth} onClick={() => onSelect(frame.depth)}>{frame.depth}</button></td><td>{best?.san ?? "—"}{changed ? " ↔" : ""}</td><td>{formatEval(best?.score ?? null)}</td><td>{frame.nodes.toLocaleString()}</td><td>{frame.milliseconds}</td></tr>;
      })}
    </tbody></table></div><p className="muted">↔ preferred move changed since the previous observed depth. MultiPV lines may be incomplete at interruption.</p>
  </details>;
}
