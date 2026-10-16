# Web architecture

Next.js App Router serves React. The product is exclusively engine interpretation,
with optional BYOK/local AI. The desktop design on local `new` is parked.

## Current implementation

`components/StockfihApp.tsx` owns game and engine-analysis state.
`lib/chess.ts` wraps chess.js; `lib/stockfish.ts` owns the browser UCI Worker;
`lib/classify.ts` supplies legacy move labels. Their known lifecycle and
classification defects are tracked in `BUG-FIX-PLAN.md`.

`src/core/interpretation.ts` replays game and PV moves into checked facts and
owns the direct browser chat-completions client. `MoveInspector` owns model
settings, target selection and request lifetime. Keys remain in component
memory. Changing target/evidence/configuration aborts in-flight work and
invalidates displayed answers. No persistent explanation cache is used.
The old shared-token `/api/explain` returns 410; its prompt/template module
is removed. `npm test` checks the new evidence/client contract.

The inspector is mounted in `AnalysisPanel`. `StockfihApp` supplies the
current position and selected game move. Inspector selections expose their
before-FEN without moving the replay board; synchronizing that board is a
remaining v1 task. Game import is collapsed above the workspace.

The model returns fact IDs; code rejects unknown references and extra prose,
then renders known facts. It cannot introduce a move, evaluation or tactical
cause. Legal replay is not proof that engine evidence is correct: engine
lifecycle/provenance repairs remain prerequisites for deeper interpretation.
Root-line scores are labelled separately from individual PV-ply positions.

## Model boundary

Requests contain only selected-move evidence and go directly to the chosen
HTTPS or loopback endpoint. BYOK is transient tab state; it is never stored,
embedded, logged or sent through the app server. No automatic requests.
Provider errors are visible, requests are cancellable with a 30-second
limit, and outputs are capped at 120 tokens. Browser CORS/private-network
policy limits compatibility. A future relay requires an explicit access
and destination policy; do not introduce an arbitrary-URL server proxy.

## Planned boundaries

Migrate incrementally into core chess, engine, interpretation and storage
modules as repair groups require them. Review and Explore features import
only core, never one another; core never imports a feature. The current
core temporarily imports legacy shared types from `lib/types.ts`.
Application composition wires features together. Do not invent a feature
registry or create empty folders before an actual task needs them.

Stable game/run identities and AbortSignal ownership must prevent old
results from publishing into a new session. Future evidence snapshots need
engine build/options, actual depth, perspective, WDL/score/bounds, position,
terminal state and legal lines. Search traces and tested chess features
precede optional NNUE interventions. Static eval is not piece attribution.

## UI and verification

Use independent project styles, with a minimal board-first interface like
Lichess. The current slice removes the pitch/feature-card block and adds
an inspector; the full neutral-theme/layout redesign is still planned.
Every played move and every engine PV ply is a target for inspection.
Free FEN exploration, board synchronization to selected PV ply and search
traces remain future work. Tutoring, coaching, learner memory, profiles and
drills are excluded from the architecture, not dormant capabilities.

Unit tests cover target replay, evidence checking, model transport and
cancellation with mocked providers. Existing real engine capture fixtures
are reused. Browser smoke tests verify discoverability and game/PV controls;
live providers are not called without a configured user endpoint/key.

The release baseline now has `npm run check` and a production-browser smoke
suite. Installation verifies pinned engine assets before copying them;
no fonts are downloaded at build or runtime. Runtime audit is a separate
CI check, with development-tooling exceptions recorded in DEPENDENCIES.md.

`src/core/engine.ts` now owns the serialized UCI lane and worker lifetime.
`lib/stockfish.ts` is a compatibility export during migration. Each active
startup/search has a deadline and AbortSignal; cancellation/error retires
its worker, and messages from retired workers are ignored. Game review
aborts its previous run before replacement and guards every publication.

`src/core/uci.ts` parses scores, bounds and WDL independently of PV. It
normalizes White's perspective and derives explicit terminal outcomes from
chess.js. The classifier uses expected-score loss and reports unavailable
when it lacks outcome evidence; it never turns mate distance into pawns.

The workspace now separates the immutable imported game from an independent
exploration history. `src/core/exploration.ts` applies legal UCI moves and
truncates redo on branching. FEN/file/PGN input stays at the boundary. The
selected interpretation target controls both board position and arrow; a
before/result toggle replays exactly that move. Keyboard and pointer moves,
explicit promotions, undo/redo and navigation share the same chess core.
The interface uses project-owned neutral tokens and a responsive board/rail.
