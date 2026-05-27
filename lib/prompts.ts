import { formatEvalLong } from "@/lib/classify";
import type { ExplainRoutePayload } from "@/lib/types";

export const COACH_SYSTEM_PROMPT =
  "You are a precise chess coach powered by Stockfish analysis. Explain the selected move to a human player. Do not hallucinate engine lines beyond the data provided. If the move is bad, explain the concrete reason. If the move is good, explain the idea. Keep it concise, instructive, and position-specific. Output exactly four sections with these labels: Verdict, Better move, Why, Pattern to remember.";

const toneInstructions = {
  default:
    "Target a beginner-to-intermediate club player. Keep it crisp, practical, and specific to the move.",
  "1200":
    "Explain this like a strong coach talking to a 1200-rated player. Use plain language, avoid jargon unless you define it, and focus on one clear idea.",
  tactical:
    "Frame the explanation tactically. Emphasize forcing moves, loose pieces, king safety, threats, and calculation shortcuts.",
} as const;

export function buildExplanationMessages(payload: ExplainRoutePayload) {
  return [
    {
      role: "system",
      content: COACH_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: [
        toneInstructions[payload.tone],
        `FEN: ${payload.fen}`,
        `Move played: ${payload.playedMove}`,
        `Best move: ${payload.bestMove ?? "No better move found"}`,
        `Classification: ${payload.classification}`,
        `Eval before move: ${formatEvalLong(payload.evalBefore)}`,
        `Eval after move: ${formatEvalLong(payload.evalAfter)}`,
        `PGN context:\n${payload.pgnContext}`,
      ].join("\n"),
    },
  ];
}

export function buildFallbackExplanation(payload: ExplainRoutePayload) {
  const bestMoveText =
    payload.bestMove && payload.bestMove !== payload.playedMove
      ? payload.bestMove
      : "The played move already matches the engine's top recommendation.";

  const verdict =
    payload.classification === "Blunder" || payload.classification === "Mistake"
      ? `This was a ${payload.classification.toLowerCase()}. The move let the evaluation swing too far and gave the opponent a concrete target.`
      : payload.classification === "Inaccuracy"
        ? "This was playable, but it made the position easier for the opponent than necessary."
        : `This was a ${payload.classification.toLowerCase()} move. You were aligned with the engine's main idea.`;

  const why =
    payload.tone === "tactical"
      ? "Check forcing sequences first: checks, captures, and threats. If your move does not address the opponent's active idea, tactics usually punish it quickly."
      : payload.tone === "1200"
        ? "Ask what changed after your move. Did you leave a piece loose, weaken your king, or miss a simple threat? The best move usually fixes one of those problems while improving your own position."
        : "Compare your move to the engine move in terms of king safety, loose pieces, and who controls the next forcing move. The best move either solves a threat or creates one with less risk.";

  const pattern =
    payload.classification === "Blunder"
      ? "Before you play, scan for your opponent's checks, captures, and direct threats."
      : payload.classification === "Mistake" || payload.classification === "Inaccuracy"
        ? "When several moves look natural, prefer the one that improves your worst-placed piece without loosening your position."
        : "Strong moves usually improve activity and reduce the opponent's counterplay at the same time.";

  return [
    `Verdict: ${verdict}`,
    `Better move: ${bestMoveText}`,
    `Why: ${why}`,
    `Pattern to remember: ${pattern}`,
  ].join("\n\n");
}
