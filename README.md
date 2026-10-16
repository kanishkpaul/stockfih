# Stockfih

**Inspect what Stockfish searches.** A board-first web app for game review,
legal position exploration and evidence-based move interpretation. No model
key is needed to use the workspace.

![Search workspace](docs/demo/desktop.png)

[Short recorded demo](docs/demo/walkthrough.webm) · [60-second walkthrough](docs/DEMO.md) ·
[Architecture](docs/ARCHITECTURE.md) · [Verified scope and limits](docs/AUDIT-STATUS.md)

## Try it

Requires Node 20.9+ (CI uses Node 24).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The sample is already loaded. Choose **Analyze
Game**, then select a game move or any ply in any candidate line. The board
shows its before-position; **Show result** applies exactly that move.

- **Review:** PGN text/file import, navigation, outcome-based labels and critical moves.
- **Explore:** FEN import, legal drag/click/UCI moves, promotion, undo/redo and independent branches.
- **Search:** inspect evaluations and candidates at reported depths, preferred-move changes, nodes and elapsed time.
- **Compare selected move:** two fresh searches at the same root/settings, one restricted to that move; inspect the searched reply and alternative score.
- **Export trace:** JSON with positions, lines, depth observations, engine hashes/options and comparison evidence.

## Optional AI, under your control

Open **AI connection — BYOK or local** and enter an OpenAI-compatible base
URL/model and optional key. The model selects and orders checked facts:
move effects, geometric attacks, material, searched replies, WDL and
same-root comparisons. Unknown references or generated prose are rejected.

Keys stay in tab memory and go directly to the selected endpoint. No shared
server key, persistence, proxy, automatic request or silent fallback. Requests
are cancellable, output-bounded and limited to 30 seconds. Hosted providers
need HTTPS and browser CORS support; local HTTP needs a loopback endpoint
and appropriate browser permission. [Local setup and live verification](docs/LOCAL-AI.md).

The cached Qwen/llama.cpp setup passed the real Chromium flow. Hosted live
BYOK testing was waived; transport, transient credentials and checker behavior
are covered by tests. This is search interpretation, not a causal explanation
of NNUE internals or a guarantee that an engine line will be played.

## Engineering and verification

```sh
npm run check             # lint, strict types, unit regressions, production build
npx playwright install chromium
npm run test:browser      # actual shipped Worker and browser workflows
npm audit --omit=dev
```

The engine has a serialized UCI lane, bounded startup/search lifetimes,
retirement on cancellation/error and retry. Tests replay captured output from
the pinned build and exercise actual WASM in Chromium. The chess boundary
preserves mate winners, terminal states, WDL perspective and legal move provenance.
The build uses system fonts and verified local engine assets. CI repeats the
checks from a fresh install. [Dependency review](docs/DEPENDENCIES.md).

Finite-depth lite Stockfish is weaker than the full engine. Outcome labels
use transparent UI thresholds, not validated human-performance probabilities.
Chromium is tested; native Safari/Firefox and physical phones remain unverified.
FEN searches cannot reconstruct repetition history. See the
[audit disposition](docs/AUDIT-STATUS.md) for all recorded limitations.

## Scope and repository

Interpretability only. Tutoring, coaching, quizzes, drills and learner profiles
are excluded. [V1 acceptance](docs/RELEASE.md), [scope](docs/PLAN.md),
[decisions](docs/DECISIONS.md), [style](docs/STYLE.md) and
[independent design](DESIGN.md) document the engineering choices.

`main` is the active web app. The parked desktop rebuild stays on local-only
`new`; never push that branch. The historical audit reproduces source at its
recorded commit, not current defects. Deployment is excluded at the owner's request; the verified demo runs locally.

## License

Stockfih application code is MIT. The separately distributed, unmodified
Stockfish engine is GPLv3. Its license, corresponding source archive, required
lite weights, upstream notices and build instructions are served in
[public/stockfish](public/stockfish/SOURCE.md). No third-party design kit or
reference-site code/assets are used.
