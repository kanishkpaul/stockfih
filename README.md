# Stockfih

Stockfih is a polished chess analysis web app that blends client-side Stockfish review with a language-model coaching layer.

Tagline: **“Stockfish, but it tells you what you were supposed to see.”**

## Screenshots

Add demo screenshots or a short screen recording here:

- `docs/stockfih-board.png`
- `docs/stockfih-analysis-panel.png`
- `docs/stockfih-mobile.png`

## Features

- Paste or load a PGN and parse headers, result, and move text
- Replay the game on an interactive chessboard with previous/next controls
- Navigate with keyboard left/right arrows
- Flip the board and inspect move-by-move positions
- Analyze positions in-browser with Stockfish running in a Web Worker
- Show best move, eval before/after, eval swing, and move classification
- Request concise move explanations through `/api/explain`
- Fall back to a deterministic local explanation template when `HF_TOKEN` is missing
- Cache explanations client-side in `localStorage`
- Dark, premium “frontier lab” UI with loading, progress, and empty states

## Tech Stack

- Next.js 16 App Router with TypeScript
- Tailwind CSS v4
- shadcn-style local UI primitives
- `react-chessboard`
- `chess.js`
- `stockfish` WASM package
- Hugging Face Inference API

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` by default. If that port is already in use, Next.js will move to the next free port.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
HF_TOKEN=
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
```

- `HF_TOKEN`: optional. If omitted, Stockfih uses the local explanation fallback.
- `HF_MODEL`: optional. Defaults to `mistralai/Mistral-7B-Instruct-v0.3`.

## Project Structure

```text
app/
  api/explain/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  AnalysisPanel.tsx
  ChessBoardPanel.tsx
  EvalBar.tsx
  MoveList.tsx
  PgnInput.tsx
  StockfihApp.tsx
  ui/
lib/
  chess.ts
  classify.ts
  prompts.ts
  stockfish.ts
  types.ts
  utils.ts
public/
  stockfish/
scripts/
  copy-stockfish.mjs
```

## How Stockfish Is Wired

- The app uses the `stockfish` npm package.
- A postinstall script copies the browser engine files into `public/stockfish/`.
- The client creates a dedicated Web Worker against `/stockfish/stockfish-18-lite-single.js`.
- Analysis is performed position by position with UCI commands.
- MultiPV is enabled so the UI can surface the best move plus alternatives.
- If the worker fails or times out, the UI shows a useful analysis error instead of crashing.

## How HF Explanations Work

- The client never sees `HF_TOKEN`.
- The app sends move context to `app/api/explain/route.ts`.
- The route forwards a chat-completion request to Hugging Face using `HF_MODEL`.
- Prompting is constrained to the concrete engine data already computed.
- If HF is unavailable or `HF_TOKEN` is unset, the route returns a deterministic template explanation.

## Known Limitations

- Analysis is sequential, so long PGNs at depth 14 can take a while in-browser.
- The board highlights the engine suggestion for the current board position, while the right panel reviews the selected move that led there.
- Move quality labels for `Brilliant` and `Great` use lightweight heuristics on top of the requested eval-loss thresholds.
- Client-side caching is per-browser and per-device.

## Future Roadmap

- Deeper PV browsing with full candidate lines
- Opening name detection and phase segmentation
- Better “brilliant move” heuristics using sacrifice detection
- Annotated share links and exported reports
- Batch review for multiple PGNs
- Optional persisted analysis snapshots

## Why This Is Interesting

- It bridges symbolic search engine evaluation with natural-language explanation.
- It turns raw engine analysis into human-legible coaching.
- It demonstrates AI product engineering, chess engine integration, LLM prompting, UI systems, and explainability.

## Development Notes

- `npm run lint` checks the TypeScript/React surface.
- `npm run build` validates the production bundle.
- The bundled Stockfish files are copied into `public/stockfish/` and ignored by ESLint.

## License Notes

- The repository includes the Stockfish browser engine assets under `public/stockfish/`.
- See `public/stockfish/Copying.txt` for the engine’s GPLv3 license notice.
