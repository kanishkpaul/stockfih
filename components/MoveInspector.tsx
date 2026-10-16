"use client";

import { useEffect, useRef, useState } from "react";
import { completionUrl, explainMove, movesToInspect, type ModelConnection, type MoveEvidence } from "@/src/core/interpretation";
import type { ParsedGameMove, PositionAnalysis } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function MoveInspector({ position, played }: {
  position: PositionAnalysis | null;
  played: ParsedGameMove | null;
}) {
  const [connection, setConnection] = useState<ModelConnection>({
    baseUrl: "http://localhost:11434/v1", model: "", apiKey: "",
  });
  const [selected, setSelected] = useState("");
  const [answer, setAnswer] = useState<{ identity: string; text: string } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ identity: string; message: string } | null>(null);
  const active = useRef<AbortController | null>(null);
  let targets: MoveEvidence[] = [];
  let evidenceError: string | null = null;
  try { targets = movesToInspect(position, played); }
  catch { evidenceError = "Cannot replay this evidence legally. Analyze the game again before requesting an explanation."; }
  const target = targets.find(move => move.id === selected) ?? targets[0];
  // Keys stay in React memory. Provider identity uses a revision, never key text.
  const [revision, setRevision] = useState(0);
  const identity = JSON.stringify([target, connection.baseUrl, connection.model, revision]);

  useEffect(() => {
    return () => active.current?.abort();
  }, [identity]);

  function configure(field: keyof ModelConnection, value: string) {
    active.current?.abort();
    setConnection(current => ({ ...current, [field]: value }));
    setRevision(current => current + 1);
    setAnswer(null);
    setFailure(null);
  }

  async function explain() {
    if (!target) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setPending(identity);
    setFailure(null);
    try {
      const text = await explainMove(target, connection, controller.signal);
      if (!controller.signal.aborted) setAnswer({ identity, text });
    } catch (error) {
      if (!controller.signal.aborted) setFailure({
        identity,
        message: error instanceof TypeError
          ? "Cannot reach this model. Check the URL and allow this app's origin in the model server's CORS settings. HTTPS pages may block local HTTP."
          : error instanceof Error ? error.message : "The model request failed. Retry when it is available.",
      });
    } finally {
      if (active.current === controller) setPending(null);
    }
  }

  let destination = "Configure a valid endpoint";
  try { destination = new URL(completionUrl(connection.baseUrl)).origin; } catch { /* Input can be incomplete while editing. */ }

  return (
    <section className="inspector" aria-label="Move interpretation">
      <h3>Inspect a move</h3>
      {evidenceError && <p role="alert">{evidenceError}</p>}
      <details>
        <summary>AI connection — BYOK or local</summary>
        <p>OpenAI-compatible chat endpoint. Ollama uses port 11434; LM Studio commonly uses 1234. Hosted services need browser CORS support.</p>
        <label htmlFor="model-url">Base URL</label>
        <input id="model-url" type="url" value={connection.baseUrl} onChange={event => configure("baseUrl", event.target.value)} spellCheck={false} />
        <label htmlFor="model-name">Model</label>
        <input id="model-name" value={connection.model} onChange={event => configure("model", event.target.value)} spellCheck={false} />
        <label htmlFor="model-key">API key (optional for local models)</label>
        <input id="model-key" type="password" autoComplete="off" value={connection.apiKey} onChange={event => configure("apiKey", event.target.value)} />
        <p>Key held only in this tab&apos;s memory. Requests go directly to {destination}; no app-server proxy or automatic model calls.</p>
      </details>
      {target ? (
        <>
          <label htmlFor="inspect-move">Game move or Stockfish continuation</label>
          <select id="inspect-move" value={target.id} onChange={event => setSelected(event.target.value)}>
            {targets.map(move => <option key={move.id} value={move.id}>{move.label}</option>)}
          </select>
          <details>
            <summary>Position before this move (FEN)</summary>
            <p className="font-mono text-sm">{target.fen}</p>
          </details>
          <ul aria-label="Checked evidence">{target.facts.map(fact => <li key={fact}>{fact}</li>)}</ul>
          <p className="inspector-note">Stockfish evidence explains the searched line. It does not reveal the network&apos;s internal reasoning. AI can select and order these checked facts; it cannot invent tactical causes.</p>
          <div className="inspector-actions">
            <Button onClick={explain} disabled={pending === identity || !connection.model.trim()}>Explain selected move</Button>
            {pending === identity && <Button variant="secondary" onClick={() => { active.current?.abort(); setPending(null); }}>Cancel</Button>}
          </div>
          {pending === identity && <p role="status">Requesting checked explanation…</p>}
          {failure?.identity === identity && <p role="alert">{failure.message}</p>}
          {answer?.identity === identity && <p className="inspector-answer" role="status">{answer.text}</p>}
        </>
      ) : <p>Analyze a game to inspect its moves and every ply in Stockfish&apos;s candidate lines.</p>}
    </section>
  );
}
