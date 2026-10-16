# Stockfih

A web workspace for inspecting Stockfish's analysis and the evidence behind
every move. Review games and explore positions; interpretability is the
sole product scope, with optional BYOK/local AI explanations.

`main` holds the Next.js app. The desktop rebuild stays on local-only `new`.
The interface direction is minimal and Lichess-inspired, without the shared
design kit.

## Run

Requires Node 20.9 or newer.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. Load a PGN or the sample, select a game move,
and run Analyze Game to inspect all Stockfish candidate lines. The move
inspector includes every ply in each available PV, not just its first move.
Free FEN exploration and search-depth traces are planned.

## Optional AI

Open **AI connection — BYOK or local**. Enter an OpenAI-compatible base URL,
model name and optional API key, then choose **Explain selected move**.
Requests go directly from the browser to the chosen endpoint; keys stay in
this tab's memory. No shared server token, automatic calls, silent fallback
or persistent explanation cache. The retired `/api/explain` route returns 410;
`HF_TOKEN`/`HF_MODEL` are no longer used.

Local examples: Ollama `http://localhost:11434/v1`, LM Studio
`http://localhost:1234/v1`. The local server must permit the app's origin.
Hosted endpoints need HTTPS and browser CORS support. An HTTPS deployment
may also need browser local-network permission; connection failures are
shown, never silently rerouted. See [Ollama compatibility](https://docs.ollama.com/api/openai-compatibility),
[Ollama origins](https://docs.ollama.com/faq) and
[LM Studio CORS settings](https://lmstudio.ai/docs/developer/core/server/settings).

AI currently selects and orders checked facts. Free-form generated causes
are not displayed. This first slice explains observed move/line evidence;
it does not yet explain NNUE internals or prove why a move is optimal.
Provider transport is tested with mocks; no live model calls were made.

## Checks and plans

```bash
npm test
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

- [Interpretability roadmap](docs/PLAN.md)
- [V1 finish line](docs/RELEASE.md): working scope, acceptance criteria and demonstration
- [Original bug audit](docs/BUG-AUDIT.md) and [repair backlog](docs/BUG-FIX-PLAN.md)
- [Frontend direction](docs/FRONTEND-DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), [style](docs/STYLE.md)

Known engine/classification and dependency issues remain in the backlog.
The audit script reproduces the original audited commit, not current fixes.

## License

Stockfih's code is MIT. The distributed Stockfish files are GPLv3, from the
pinned npm package, with their license in `public/stockfish/Copying.txt`.
