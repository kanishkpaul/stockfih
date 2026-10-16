# Web architecture

Next.js App Router serves a React chess workspace. Stockfish runs in a local
browser Worker. Review and Explore have equal priority; interpretation is the
sole scope. The desktop branch `new` stays local. No tutoring subsystem exists.

## Ownership and boundaries

`StockfihApp` composes the immutable imported game, independent exploration
history, analysis snapshots and selection. `src/core/exploration.ts` validates
FEN and legal moves; branching discards redo without altering the game.
`lib/chess.ts`, `lib/classify.ts` and `lib/types.ts` are shared legacy modules
migrated only as repairs require. Features import core, never other features;
core never imports feature UI. There is no speculative feature registry.

`src/core/engine.ts` owns one serialized UCI lane. Startup/search deadlines,
AbortSignal and worker retirement isolate jobs. Retired-worker messages cannot
finish later jobs. Game replacement and exploration changes abort active work.
`src/core/uci.ts` parses score independently of PV, preserves bounds and
normalizes scores/WDL to White. Explicit legal terminal outcomes prevent mate
zero from losing its winner. Classification uses mover expected-score loss;
missing evidence is unavailable and mate is never converted to centipawns.

## Search interpretation

Each completed snapshot retains reported depth frames with MultiPV, nodes and
elapsed milliseconds. Provenance records package/assets, requested depth,
Threads, Hash, MultiPV, WDL and optional root restriction. Frames are actual
engine observations, not reconstructed thinking. Incomplete MultiPV at a depth
remains visible as incomplete evidence. Final lines may have different depths.

A comparison clears search history before each of two searches at the same
root and settings: unrestricted, then `searchmoves` restricted to the selected
legal move. The restricted PV exposes the searched opponent reply. Finite-depth
scores can differ even for the same move. This is a counterfactual search,
not proof of a causal network explanation. JSON export includes snapshots,
trace and comparison; it has no model configuration or credentials.

## Checked AI boundary

`src/core/interpretation.ts` legally replays every game/PV move into facts.
`src/core/search-trace.ts` adds comparison facts only when FEN and UCI match.
The model selects fact IDs; code rejects unknown IDs, duplicates, extra prose
and missing target-move references, then renders the known text. Root scores
are never presented as separate evaluations of intermediate PV plies.

`MoveInspector` owns transient connection settings and request lifetime.
Changing target/evidence/configuration invalidates answers and aborts requests.
Keys stay in React tab memory and go directly to the chosen HTTPS or loopback
origin. No persistence, server proxy, shared key, automatic calls or silent
fallback. Requests omit credentials/referrer, reject redirects, cap output at
120 tokens and time out after 30 seconds. Browser CORS/local-network policy
limits provider compatibility. The retired `/api/explain` returns 410.

## Workspace and verification

The selected inspection controls before-FEN, arrow and optional resulting board.
Review supports PGN/file import and navigation; Explore supports FEN, legal
pointer/UCI moves, promotion, branching and undo/redo. Project-owned neutral
styles and local assets support phone tabs, keyboard focus and reduced motion.

`npm run check` runs lint, types, unit regression tests and a Webpack production
build. Playwright uses the actual shipped Worker and exercises both workflows,
replacement/cancel recovery, depth selection, comparisons, exports and layout.
Installation verifies pinned engine asset hashes/modes. CI runs these checks,
runtime dependency audit and attribution guard. Development-only upstream
audit exceptions are recorded in DEPENDENCIES.md. No network font dependency.
