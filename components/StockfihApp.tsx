"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FlipHorizontal2 } from "lucide-react";
import { SearchTrace } from "@/components/SearchTrace";
import { comparisonFacts, traceExport } from "@/src/core/search-trace";
import { MoveInspector } from "@/components/MoveInspector";
import { MoveList } from "@/components/MoveList";
import { PositionBoard } from "@/components/PositionBoard";
import { Button } from "@/components/ui/button";
import { DEFAULT_FEN, parsePgn, SAMPLE_PGN } from "@/lib/chess";
import { buildMoveAnalysis, formatEval } from "@/lib/classify";
import { getStockfishClient } from "@/src/core/engine";
import { explore, play, type Exploration } from "@/src/core/exploration";
import { movesToInspect, type MoveEvidence } from "@/src/core/interpretation";
import type { MoveAnalysis, PositionAnalysis, MoveComparison } from "@/lib/types";

export function StockfihApp() {
  const [game, setGame] = useState(() => parsePgn(SAMPLE_PGN));
  const [pgn, setPgn] = useState(SAMPLE_PGN);
  const [mode, setMode] = useState<"review" | "explore">("review");
  const [variation, setVariation] = useState<Exploration>(() => explore(DEFAULT_FEN));
  const [ply, setPly] = useState(0);
  const [fenInput, setFenInput] = useState(DEFAULT_FEN);
  const [uciInput, setUciInput] = useState("");
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [depth, setDepth] = useState(12);
  const [analyses, setAnalyses] = useState<Record<string, PositionAnalysis>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "cancelled" | "error">("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [inspected, setInspected] = useState("");
  const [traceDepth, setTraceDepth] = useState<number | null>(null);
  const [comparison, setComparison] = useState<MoveComparison | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [square, setSquare] = useState<string | null>(null);
  const [railPanel, setRailPanel] = useState("engine");
  const [promotion, setPromotion] = useState<{ fen: string; from: string; to: string } | null>(null);
  const run = useRef<AbortController | null>(null);
  useEffect(() => () => run.current?.abort(), []);

  const baseFen = mode === "review" ? game.moves[ply - 1]?.afterFen ?? game.initialFen : variation.fens[variation.cursor];
  const position = analyses[baseFen] ?? null;
  const played = mode === "review" ? game.moves[ply - 1] ?? null : null;
  let targets: MoveEvidence[] = [];
  let evidenceError: string | null = null;
  const frame = position?.trace?.find(frame => frame.depth === traceDepth);
  const inspectedPosition = position && frame ? { ...position, depth: frame.depth, lines: frame.lines } : position;
  try {
    targets = movesToInspect(inspectedPosition, played);
    if (comparison) targets = targets.map(target => ({ ...target, facts: [...target.facts, ...comparisonFacts(comparison, target)] }));
  }
  catch { evidenceError = "The engine evidence cannot be replayed legally. Analyze this position again."; }
  const target = targets.find(move => move.id === inspected) ?? targets[0];
  let boardFen = target?.fen ?? baseFen;
  if (target && showResult) {
    const board = new Chess(target.fen);
    board.move({ from: target.uci.slice(0, 2), to: target.uci.slice(2, 4), promotion: target.uci[4] });
    boardFen = board.fen();
  }
  const board = new Chess(boardFen);
  const cursor = mode === "review" ? ply : variation.cursor;
  const moves = mode === "review" ? game.moves : variation.moves;
  const moveAnalyses: Record<number, MoveAnalysis> = {};
  for (const move of moves) {
    if (analyses[move.beforeFen] && analyses[move.afterFen]) moveAnalyses[move.index] = buildMoveAnalysis(move, analyses[move.beforeFen], analyses[move.afterFen]);
  }

  function stop() { run.current?.abort(); setStatus(current => current === "loading" ? "cancelled" : current); }
  function resetInspection() { setTraceDepth(null); setComparison(null); setInspected(""); setShowResult(false); setSquare(null); setPromotion(null); setError(null); }
  function navigate(next: number) {
    if (mode === "explore") { stop(); setVariation(current => ({ ...current, cursor: next })); }
    else setPly(next);
    resetInspection();
  }
  const keyboard = useEffectEvent((event: KeyboardEvent) => {
    const control = event.target instanceof HTMLElement && event.target.closest("input, textarea, select, summary, [contenteditable=true]");
    if (control || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      navigate(event.key === "Home" ? 0 : event.key === "End" ? moves.length : Math.max(0, Math.min(moves.length, cursor + (event.key === "ArrowRight" ? 1 : -1))));
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  function loadPgn(text: string) {
    try {
      const parsed = parsePgn(text); stop(); setGame(parsed); setPgn(text); setPly(0);
      setMode("review"); setAnalyses({}); setStatus("idle"); resetInspection();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Cannot parse this PGN."); }
  }
  function loadFen(fen: string) {
    try { const next = explore(fen); stop(); setVariation(next); setMode("explore"); setFenInput(next.fens[0]); setStatus("idle"); resetInspection(); }
    catch { setError("Invalid FEN. Include both kings and all six FEN fields."); }
  }
  function applyMove(fen: string, uci: string) {
    try {
      const base = mode === "explore" && fen === variation.fens[variation.cursor] ? variation : explore(fen);
      const next = play(base, uci); stop(); setVariation(next); setMode("explore"); resetInspection(); setUciInput("");
      return true;
    } catch { setError("That move is not legal in this position. Use UCI notation, for example e2e4."); return false; }
  }
  function move(from: string, to: string) {
    const choices = board.moves({ verbose: true }).filter(candidate => candidate.from === from && candidate.to === to);
    if (choices.some(candidate => candidate.promotion)) { setPromotion({ fen: boardFen, from, to }); return false; }
    return applyMove(boardFen, `${from}${to}`);
  }
  function clickSquare(next: string) {
    if (square && square !== next && board.moves({ verbose: true }).some(candidate => candidate.from === square && candidate.to === next)) {
      move(square, next); setSquare(null);
    } else setSquare(next);
  }

  async function analyze() {
    stop(); const controller = new AbortController(); run.current = controller;
    setStatus("loading"); setError(null);
    const fens = mode === "review" ? [game.initialFen, ...game.moves.map(move => move.afterFen)] : [baseFen];
    setProgress({ completed: 0, total: fens.length });
    try {
      const client = getStockfishClient(); await client.newGame(controller.signal);
      for (const [index, fen] of fens.entries()) {
        controller.signal.throwIfAborted();
        const result = await client.analyzePosition(fen, depth, controller.signal);
        controller.signal.throwIfAborted();
        setAnalyses(current => ({ ...current, [fen]: result }));
        setProgress({ completed: index + 1, total: fens.length });
      }
      setStatus("done");
    } catch (failure) {
      if (controller.signal.aborted) return;
      setStatus("error"); setError(failure instanceof Error ? failure.message : "Analysis failed. Retry.");
    }
  }

  async function compare() {
    if (!target) return;
    stop(); const controller = new AbortController(); run.current = controller;
    setStatus("loading"); setError(null); setProgress({ completed: 0, total: 2 });
    try {
      const client = getStockfishClient();
      await client.newGame(controller.signal);
      const unrestricted = await client.analyzePosition(target.fen, depth, controller.signal);
      controller.signal.throwIfAborted(); setProgress({ completed: 1, total: 2 });
      await client.newGame(controller.signal);
      const restricted = await client.analyzePosition(target.fen, depth, controller.signal, target.uci);
      controller.signal.throwIfAborted();
      setComparison({ fen: target.fen, uci: target.uci, unrestricted, restricted });
      setProgress({ completed: 2, total: 2 }); setStatus("done");
    } catch (failure) {
      if (controller.signal.aborted) return;
      setStatus("error"); setError(failure instanceof Error ? failure.message : "Comparison failed.");
    }
  }
  function exportTrace() {
    if (!position) return;
    const url = URL.createObjectURL(new Blob([traceExport(position, comparison)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "stockfih-search-trace.json"; link.click(); URL.revokeObjectURL(url);
  }

  const terminalText = board.isCheckmate() ? "Checkmate" : board.isStalemate() ? "Stalemate" : `${board.turn() === "w" ? "White" : "Black"} to move`;
  return <main className="workspace">
    <header className="app-header">
      <div><h1>Stockfih</h1><p>Inside the search.</p></div>
      <nav aria-label="Workspace mode">
        <button aria-pressed={mode === "review"} onClick={() => { stop(); setMode("review"); resetInspection(); }}>Review</button>
        <button aria-pressed={mode === "explore"} onClick={() => { if (mode !== "explore") loadFen(boardFen); }}>Explore</button>
      </nav>
      <span className="engine-name">Stockfish 18 · local WASM</span>
    </header>

    <details className="import-panel"><summary>Import a game or position</summary>
      <div className="import-grid">
        <form onSubmit={event => { event.preventDefault(); loadPgn(pgn); }}>
          <label htmlFor="pgn-input">Game PGN</label><textarea id="pgn-input" value={pgn} onChange={event => setPgn(event.target.value)} />
          <div className="actions"><Button type="submit">Load Game</Button><Button type="button" variant="secondary" onClick={() => loadPgn(SAMPLE_PGN)}>Load sample</Button>
            <label className="file-button">Open PGN<input type="file" accept=".pgn,.txt" onChange={async event => {
              const file = event.target.files?.[0]; if (!file) return;
              if (file.size > 200_000) { setError("PGN exceeds the 200 KB file limit."); return; }
              try { loadPgn(await file.text()); } catch { setError("Cannot read this file. Paste its PGN text instead."); }
            }} /></label></div>
        </form>
        <form onSubmit={event => { event.preventDefault(); loadFen(fenInput); }}>
          <label htmlFor="fen-input">Position FEN</label><textarea id="fen-input" value={fenInput} onChange={event => setFenInput(event.target.value)} />
          <div className="actions"><Button type="submit">Load position</Button><Button type="button" variant="secondary" onClick={() => loadFen(DEFAULT_FEN)}>Start position</Button></div>
        </form>
      </div>
    </details>
    {(error || evidenceError) && <p className="error" role="alert">{error ?? evidenceError}</p>}

    <div className="workspace-grid">
      <section className="board-column" aria-label="Position workspace">
        <div className="position-heading"><strong>{target?.label ?? (mode === "review" ? "Game start" : "Exploration")}</strong><span>{terminalText}</span></div>
        <PositionBoard fen={boardFen} uci={!showResult ? target?.uci : undefined} selected={square} orientation={orientation} onMove={move} onSquare={clickSquare} />
        <div className="board-caption"><span>{target ? (showResult ? "Position after inspected move" : "Position before inspected move") : "Current position"}</span>
          {target && <button className="text-button" onClick={() => setShowResult(current => !current)}>{showResult ? "Show before" : "Show result"}</button>}
        </div>
        <div className="transport" aria-label="Move navigation">
          <Button variant="secondary" aria-label="First position" disabled={cursor === 0} onClick={() => navigate(0)}><ChevronsLeft size={18} /></Button>
          <Button variant="secondary" aria-label="Previous move" disabled={cursor === 0} onClick={() => navigate(cursor - 1)}><ChevronLeft size={18} /></Button>
          <span>{cursor} / {moves.length}</span>
          <Button variant="secondary" aria-label="Next move" disabled={cursor === moves.length} onClick={() => navigate(cursor + 1)}><ChevronRight size={18} /></Button>
          <Button variant="secondary" aria-label="Last position" disabled={cursor === moves.length} onClick={() => navigate(moves.length)}><ChevronsRight size={18} /></Button>
          <Button variant="ghost" aria-label="Flip board" onClick={() => setOrientation(current => current === "white" ? "black" : "white")}><FlipHorizontal2 size={18} /></Button>
        </div>
        {promotion && <fieldset className="promotion"><legend>Choose promotion</legend>{["q", "r", "b", "n"].map((piece, index) => <Button key={piece} onClick={() => applyMove(promotion.fen, `${promotion.from}${promotion.to}${piece}`)}>{["Queen", "Rook", "Bishop", "Knight"][index]}</Button>)}<Button variant="ghost" onClick={() => setPromotion(null)}>Cancel promotion</Button></fieldset>}
        <details className="board-tools"><summary>Move entry and FEN</summary>
        <form className="move-entry" onSubmit={event => { event.preventDefault(); applyMove(boardFen, uciInput.trim()); }}>
          <label htmlFor="keyboard-move">Play a move</label><input id="keyboard-move" placeholder="e2e4 or a7a8n" value={uciInput} onChange={event => setUciInput(event.target.value)} spellCheck={false} autoComplete="off" />
          <Button variant="secondary">Play</Button><Button type="button" variant="ghost" onClick={() => loadFen(boardFen)}>Explore this position</Button>
        </form>
        <details className="position-fen"><summary>Displayed FEN</summary><p className="notation" data-testid="displayed-fen">{boardFen}</p></details>
        <p className="board-hint">Drag or click squares to explore. Keyboard: enter UCI above; use ← → or Home / End to navigate.</p>
        </details>
      </section>

      <aside className="analysis-rail" aria-label="Engine inspection">
        <div className="rail-tabs" role="tablist" aria-label="Inspection panels" onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const ids = ["engine", "moves", "explain"];
          const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (ids.indexOf(railPanel) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
          setRailPanel(ids[next]);
          (event.currentTarget.querySelectorAll("button")[next] as HTMLButtonElement).focus();
        }}>{[["engine", "Engine"], ["moves", "Moves"], ["explain", "Explain"]].map(([id, label]) => <button key={id} id={`tab-${id}`} role="tab" tabIndex={railPanel === id ? 0 : -1} aria-selected={railPanel === id} aria-controls={`panel-${id}`} onClick={() => setRailPanel(id)}>{label}</button>)}</div>
        <section id="panel-engine" className="engine-panel" data-panel="engine" data-active={railPanel === "engine"}>
          <div className="section-heading"><h2>Search</h2><span className="eval" aria-label="Evaluation from White's perspective">{formatEval(position?.evaluation ?? null)}</span></div>
          <p className="muted">{played ? "Evaluation after the selected game move" : "Evaluation of the analysis root"} · White&apos;s perspective</p>
          <div className="actions"><label htmlFor="depth">Depth</label><select id="depth" value={depth} disabled={status === "loading"} onChange={event => { stop(); setDepth(Number(event.target.value)); setAnalyses({}); resetInspection(); }}>{[8, 10, 12, 14, 16].map(value => <option key={value}>{value}</option>)}</select>
            <Button onClick={analyze} disabled={status === "loading"}>{mode === "review" ? "Analyze Game" : "Analyze position"}</Button>
            {status === "loading" && <Button variant="secondary" onClick={stop}>Cancel analysis</Button>}
          </div>
          <p role="status" aria-label="Analysis status">{status === "loading" ? `Analyzing ${progress.completed} / ${progress.total} positions…` : status === "done" ? "Analysis complete" : status === "cancelled" ? "Analysis cancelled. Partial results are retained." : status === "error" ? "Analysis failed. Retry when ready." : "Ready"}</p>
          {status === "loading" && <progress value={progress.completed} max={progress.total || 1} aria-label="Analysis progress" />}
          {position && <><div className="actions"><Button variant="secondary" onClick={exportTrace}>Export trace</Button><span className="muted">{traceDepth ? `Inspecting depth ${traceDepth}` : `Final depth ${position.depth}`}</span></div>
            <SearchTrace position={position} selected={traceDepth} onSelect={value => {
              stop(); setTraceDepth(value); setShowResult(false);
              const first = position.trace?.find(frame => frame.depth === value)?.lines[0]?.pv[0];
              if (first) setInspected(`pv:${position.fen}:1:0:${first}`);
            }} /></>}
          {position?.terminal && <p>{position.terminal.kind === "mate" ? `Checkmate: ${position.terminal.winner === "w" ? "White" : "Black"} wins` : `Draw: ${position.terminal.reason}`}</p>}
        </section>
        <section id="panel-moves" data-panel="moves" data-active={railPanel === "moves"}><div className="section-heading"><h2>{mode === "review" ? "Game" : "Variation"}</h2><span className="muted">{mode === "review" ? game.headers.Result ?? "*" : "Independent branch"}</span></div>
          <MoveList moves={moves} analyses={moveAnalyses} selectedPly={cursor} onSelect={navigate} />
        </section>
        <section id="panel-explain" data-panel="explain" data-active={railPanel === "explain"}>
          {target && <><Button variant="secondary" disabled={status === "loading"} onClick={compare}>Compare selected move</Button><p className="muted">Search this move against unrestricted Stockfish at the same root and depth.</p></>}
          <MoveInspector targets={targets} targetId={target?.id ?? ""} onSelect={id => { stop(); setInspected(id); setShowResult(false); setSquare(null); }} /></section>
      </aside>
    </div>
    <footer>Engine evidence, not hidden reasoning. <a href="https://github.com/kanishkpaul/stockfih">Source &amp; methodology</a> · <a href="/stockfish/Copying.txt">Stockfish license</a></footer>
  </main>;
}
