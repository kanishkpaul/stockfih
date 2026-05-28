# Stockfih

Stockfih is a chess analysis app that combines browser-side Stockfish evaluation with short natural-language coaching. The goal is simple: not just "what is the best move?", but "what was the idea I missed?"

This repo is part product build, part interface experiment. I wanted a tighter bridge between symbolic search and human-readable feedback, without hiding the engine details that make the analysis useful.

## What it does today

- Parses PGN input and reconstructs the full game state move by move
- Replays the game on an interactive board with keyboard navigation
- Runs Stockfish in the browser through a dedicated Web Worker
- Scores positions before and after each move
- Classifies moves using evaluation swing and engine context
- Shows best move suggestions and current-position analysis
- Calls a protected explanation route to turn engine output into coaching text
- Falls back to deterministic local explanations when no model token is configured
- Caches generated explanations in `localStorage`

## Why this project is interesting

Most chess tooling is either:

- engine-strong but opaque, or
- beginner-friendly but strategically shallow

Stockfih sits in the middle. It keeps the engine loop real while adding an explanation layer that helps a player understand the position instead of just memorizing the top line.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- `chess.js`
- `react-chessboard`
- Stockfish WASM
- Hugging Face Inference API

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

If you want model-backed explanations, create `.env.local` with:

```bash
HF_TOKEN=your_token_here
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
```

If `HF_TOKEN` is missing, the app still works and returns template-based explanations.

## Project structure

```text
app/
  api/explain/route.ts
components/
  StockfihApp.tsx
  ChessBoardPanel.tsx
  AnalysisPanel.tsx
  MoveList.tsx
  PgnInput.tsx
lib/
  chess.ts
  classify.ts
  prompts.ts
  stockfish.ts
public/stockfish/
scripts/copy-stockfish.mjs
```

## A few implementation details I care about

- Stockfish runs client-side, so the board analysis does not depend on a backend round-trip.
- The explanation route never exposes the Hugging Face token to the client.
- The UI keeps engine facts and language-model commentary separate, so the explanation layer cannot quietly replace the analysis layer.
- Browser caching keeps repeated move explanations cheap and fast during review.

## Current limitations

- Analysis is sequential, so longer PGNs can take a while at higher depths.
- Move labels such as `Brilliant` and `Great` are heuristic rather than engine-canonical.
- Explanations are grounded on the computed engine context, but they are still short-form coaching, not formal annotations.

## What I am adding next

- Better principal variation browsing
- Opening detection and phase segmentation
- Sharper move-quality heuristics
- Shareable annotated reports
- Batch review for multiple games

## Why it belongs in this repo collection

Stockfih is the most product-shaped project here: real UI, real engine integration, real inference plumbing, and a clear point of view about how LLMs should support expert tools rather than replace them.
