import { Chess } from "chess.js";
import type { ParsedGameMove, PositionAnalysis } from "@/lib/types";

export type MoveEvidence = {
  id: string;
  label: string;
  fen: string;
  uci: string;
  facts: string[];
};

export type ModelConnection = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

const pieces: Record<string, string> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

function describe(fen: string, uci: string) {
  const board = new Chess(fen);
  const move = board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  const facts = [
    `${move.color === "w" ? "White" : "Black"} plays ${move.san}: ${pieces[move.piece]} from ${move.from} to ${move.to}.`,
  ];
  if (move.captured) facts.push(`This captures a ${pieces[move.captured]}.`);
  if (move.promotion) facts.push(`The pawn promotes to a ${pieces[move.promotion]}.`);
  if (move.isEnPassant()) facts.push("The capture is en passant.");
  if (move.isKingsideCastle()) facts.push("This is kingside castling.");
  if (move.isQueensideCastle()) facts.push("This is queenside castling.");
  if (board.isCheckmate()) facts.push("This move delivers checkmate.");
  else if (board.isCheck()) facts.push("This move gives check.");
  if (board.isStalemate()) facts.push("This move produces stalemate.");
  return { san: move.san, afterFen: board.fen(), facts };
}

function score(position: PositionAnalysis, prefix: string) {
  const evaluation = position.evaluation;
  if (!evaluation) return `${prefix}: no engine evaluation is available.`;
  if (evaluation.type === "mate") {
    if (evaluation.value === 0) return `${prefix}: ${evaluation.winner === "w" ? "White" : "Black"} has delivered checkmate.`;
    return `${prefix}: ${evaluation.value > 0 ? "White" : "Black"} has a searched mate in ${Math.abs(evaluation.value)}.`;
  }
  return `${prefix}: ${(evaluation.value / 100).toFixed(2)} pawns from White's perspective.`;
}

/** Each PV ply is replayed from its own position; line scores belong to the root search. */
export function movesToInspect(position: PositionAnalysis | null, played: ParsedGameMove | null): MoveEvidence[] {
  const targets: MoveEvidence[] = [];
  if (played) {
    if (position && position.fen !== played.afterFen) throw new Error("Analysis belongs to a different position. Analyze this game again.");
    const move = describe(played.beforeFen, `${played.from}${played.to}${played.promotion ?? ""}`);
    targets.push({
      id: `game:${played.beforeFen}:${played.lan}`,
      label: `Game: ${played.color === "w" ? `${played.moveNumber}.` : `${played.moveNumber}...`} ${move.san}`,
      fen: played.beforeFen,
      uci: `${played.from}${played.to}${played.promotion ?? ""}`,
      facts: [...move.facts, ...(position ? [score(position, "Position after the game move")] : [])],
    });
  }
  if (!position) return targets;
  for (const line of position.lines) {
    let fen = position.fen;
    const sequence: string[] = [];
    for (const [ply, uci] of line.pv.entries()) {
      const move = describe(fen, uci);
      sequence.push(move.san);
      targets.push({
        id: `pv:${position.fen}:${line.multipv}:${ply}:${uci}`,
        label: `Line ${line.multipv}, ply ${ply + 1}: ${move.san}`,
        fen,
        uci,
        facts: [
          ...move.facts,
          `Searched continuation through this move: ${sequence.join(" ")}.`,
          `Stockfish candidate ${line.multipv}, searched to depth ${line.depth}.`,
          score({ ...position, evaluation: line.score }, "Root line evaluation, not a separate evaluation of this ply"),
          "This is a searched continuation, not a guarantee of the opponent's move or a causal explanation of the network.",
        ],
      });
      fen = move.afterFen;
    }
  }
  return targets;
}

export function completionUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))) {
    throw new Error("Use HTTPS, or HTTP on localhost. Put the key in the API key field.");
  }
  url.pathname = `${url.pathname.replace(/\/$/, "")}/chat/completions`;
  return url.href;
}

/** Model output can select evidence IDs, never introduce unverified chess prose. */
export function checkedExplanation(content: string, facts: string[]) {
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== "object" || !("facts" in parsed) ||
      Object.keys(parsed).length !== 1 || !Array.isArray(parsed.facts) ||
      parsed.facts.length === 0 || parsed.facts.length > facts.length) {
    throw new Error("The model did not return checked evidence references. Try again.");
  }
  const ids: unknown[] = parsed.facts;
  if (!ids.includes(0)) throw new Error("The explanation omitted the selected move.");
  const selected = ids.map(id => {
    if (!Number.isInteger(id) || typeof id !== "number" || id < 0 || id >= facts.length) {
      throw new Error("The model referred to evidence that does not exist.");
    }
    return facts[id];
  });
  if (new Set(ids).size !== ids.length) throw new Error("The model repeated an evidence reference.");
  return selected.join("\n\n");
}

export async function explainMove(
  target: MoveEvidence,
  connection: ModelConnection,
  signal: AbortSignal,
  request: typeof fetch = fetch,
) {
  if (!connection.model.trim()) throw new Error("Enter a model name in AI connection.");
  const response = await request(completionUrl(connection.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(connection.apiKey.trim() ? { Authorization: `Bearer ${connection.apiKey.trim()}` } : {}),
    },
    body: JSON.stringify({
      model: connection.model.trim(),
      temperature: 0,
      max_tokens: 120,
      messages: [
        { role: "system", content: 'Select the evidence that best explains the selected chess move. Return only JSON {"facts":[0,1]} with unique zero-based evidence IDs, most useful first. Include the move fact (0). Never add prose, new moves, causes or facts. The evidence is computed by chess rules and Stockfish.' },
        { role: "user", content: JSON.stringify({ move: target.label, facts: target.facts }) },
      ],
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
    credentials: "omit",
    redirect: "error",
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error(`Model request failed (${response.status}). Check the connection and retry.`);
  const answer: unknown = await response.json();
  if (!answer || typeof answer !== "object" || !("choices" in answer) || !Array.isArray(answer.choices)) {
    throw new Error("The endpoint did not return a chat completion.");
  }
  const content: unknown = answer.choices[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The model returned no explanation.");
  return checkedExplanation(content, target.facts);
}
