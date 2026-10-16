# Bug-fix plan

Work on the existing Next.js web app on `main`. Keep the desktop rebuild on
local `new`. Fix one group at a time and land its regression tests with it.
This plan describes the repair backlog. The product scope is exclusively engine
interpretability (`PLAN.md`), with optional BYOK/local explanations. The first slice retired the old route and persistent cache,
added evidence-reference checking and keyboard control isolation; it did not
complete the engine, classification, dependency or redesign repairs.

## 1. Establish a reliable baseline

Addresses B24, B25, B26, B27, B28.

- Keep TypeScript strict. Fix the two lint errors and obsolete suppressions without suppressing rules.
- Add a small unit runner and browser integration runner, plus `typecheck`, `test`, and `check` scripts. CI runs lint, typecheck, unit tests, build and browser smoke tests. Include the attribution guard on main.
- Upgrade Next.js and eslint-config-next together to a supported patched release. Refresh compatible transitive packages, re-audit and record any remaining advisory's scope and disposition. Do not blindly force npm's proposed downgrade.
- Pin engine assets to the locked build; copy only required JS/WASM and license files with stable modes. Fail on missing required files and verify their hashes. Check source/license distribution obligations before release; keep the existing Stockfish exception, add no new GPL dependencies.
- Keep main's README and agent instructions aligned with the web product. Keep style guidance while marking the parked Svelte/Rust implementation notes as historical.

Done when `npm ci` leaves tracked files unchanged; lint, typecheck and build
pass; a real worker completes UCI startup in a browser; required assets are
served; tests and CI exist; dependency review is recorded. Build must not
rely on fonts being reachable from Google: use local fonts or system fonts.

## 2. Own engine and job lifetimes

Addresses B03, B04, B05.

- Give each loaded game an immutable identity and each analysis run a generation. Pass an AbortSignal through every pending operation. New game, cancellation and unmount abort the run before replacing state; stale generations cannot publish progress or results.
- Serialize engine commands through an explicit idle/searching/stopping/failed lifecycle. On timeout or abort, stop and consume the matching completion before reuse, or retire that worker and handshake a new one. `readyok` alone is not a search completion barrier.
- Add deadlines to startup and readiness as well as search. A worker error rejects all waiters, clears timers, terminates it and resets initialization so Retry can recover.
- Preserve separate ownership for future interactive and background queues; the first repair can use one serialized worker. Never let competing loops call `ucinewgame` during a live search.

Done when loading game B while A runs cannot write any A result into B;
double start does not interleave searches; cancel is visible and settles;
late output cannot complete a successor; startup failure, worker crash and
missing `readyok` all settle within a deadline and can be retried. Test with
captured output from our pinned engine and controlled clocks.

## 3. Repair chess truth before interpretation

Addresses B06, B07, B08, B09, B10, B11, B12, B29.

- Parse scores independently of PV. Represent terminal status explicitly using chess.js and captured engine evidence: checkmate with winner, stalemate/draw, and unavailable analysis. Preserve score bounds, actual depth and White's perspective.
- Turn on `UCI_ShowWDL` and capture real fixtures. Store WDL in one documented perspective and use expected-score loss to label moves. Define and calibrate thresholds in a dated decision; do not invent probabilities by mapping mate distance to centipawns.
- Handle forced-mate transitions separately: preserving a forced win is not a material blunder; allowing mate is explicit; both colors and mate zero are covered. If WDL is absent, report unavailable rather than Good.
- Remove unsupported Brilliant/Great heuristics. An optional Only move label needs a documented second-best comparison and sufficient evidence; do not implement it solely from a capture/check flag.
- Derive PGN move number and mover from each pre-move FEN. Group move-list rows by actual fullmove and color. Recognize ordinary and en-passant captures without conflating promotion or castling.

Done when tests cover start position; both colors mated; stalemate; mate in
3 to mate in 5; allowing mate; losing-mate comparisons; +10 to +7 outcome
loss; missing score; setup FEN at move 23 with Black first; both castlings;
all promotions; en passant. Capture real UCI fixtures at the tested engine
version, including missing PV and interrupted MultiPV output. Pure chess
inputs and classifier scores may be authored; UCI lines may not.

## 4. Repair cache identity and browser storage

Addresses B01, B02, B19, B20, B21; depends on stable evidence from steps 2–3.

- Explanation identity includes before-FEN, played UCI, relevant PGN context/game identity, analysis evidence fingerprint, engine/build/options/depth, tone, model and prompt/checker versions. Prefer a digest of canonical evidence over a growing concatenated string.
- Use a typed success/unavailable/error result. Distinguish deliberate deterministic narration from a provider outage. Do not store a transient fallback as a durable model success. Offer Retry and expose why a fallback was used.
- Validate stored records at read time; migrate/drop v1 entries. Bound count and bytes, expire outdated entries and tolerate denied storage, corrupt JSON and quota errors with an in-memory mode and an honest message.
- Track requests by identity with AbortController and deduplication. Old completions cannot clear another request's indicator or write into a replacement game's session.

Done when the two Nf3 games have separate entries, depth/model/prompt
changes invalidate correctly, transient failures retry, malformed/null
storage cannot crash, quota failures preserve usability, and out-of-order
requests display the correct result and loading state.

## 5. Extend checked interpretation with BYOK and local models

The first slice uses a direct browser OpenAI-compatible client. The retired
shared-token route returns 410. No server proxy, default hosted key, silent
fallback or persistent explanation cache is used. Keys live in tab memory;
CORS/private-network restrictions are shown as errors. Requests are explicit,
cancellable and time-limited. The model selects existing evidence IDs; code
renders the corresponding facts. Provider free prose is never displayed.

Next expand the facts before expanding narration: candidate/root score,
PV and refutation, evaluation by depth, move changes, material/tactical
features with tests, and only then optional NNUE interventions. Every game
move and every PV ply needs correct position provenance. Do not describe a
PV as the engine's internal reasoning or its score as a separate evaluation
of each intermediate move. Missing analysis is unavailable, never guessed.

Keep prompts limited to the selected move's evidence and outputs short.
Add compatible secure relays only if browser CORS support proves insufficient,
with explicit destination/access policy; do not resurrect an unrestricted
arbitrary-URL proxy. A local server needs an origin policy that permits the
web app. Models that cannot return valid references fail visibly.

Done when deterministic evidence is testable independently of the model;
unknown IDs, extra prose and missing target-move references are rejected;
BYOK goes only to the selected origin; local use needs no key; provider
errors and cancellation settle; replayed/stale evidence cannot be mixed.
Richer causal prose requires a separate validated claim contract first.

## 6. Build the minimal shared Review / Explore workspace

Addresses B22, B23 and the product gaps; follows `FRONTEND-DESIGN.md`.

- Use project-owned styling and the existing React stack; remove the marketing block from the tool viewport. Implement shared board, move list, engine evidence and interpretation panels before deeper search/network views.
- Review: import PGN/file, first/previous/next/last, selected move, critical moments, cancel/progress and retry. Inspect the reviewed move from its before-position; distinguish this from analysis of the current board so arrows and prose agree.
- Explore: FEN input/validation, legal drag and click moves, underpromotion, undo/redo and branching from a reviewed position without overwriting its main line. Position changes cancel stale analysis and model work.
- Scope keyboard shortcuts to the workspace; ignore form controls, editable targets and modifier combinations. Prevent default only for handled keys. Keep selected moves visible.
- Add proper labels, `aria-current`, status/error announcements, keyboard board interaction, visible focus, text verdicts and reduced motion. Keep the engine eval adjacent to the board and explicit about perspective.

Done when both workflows operate with keyboard and pointer at 360px,
768px and 1440px, without horizontal overflow or a hidden board; 200% zoom
remains usable; orientation does not change evaluation meaning; setup
PGNs stay correctly numbered; errors/cancel/retry are usable; no kit imports,
decorative card grid, runtime font CDN or unsupported chess claims appear.

## Release gate and scope

Run the aggregate checks, browser Review/Explore flows, real-engine smoke
test, cancellation race tests, storage failure tests, API boundary tests,
fresh dependency audit and attribution check. Review the full diff using
`STYLE.md`. Update architecture and dated decisions with each design change.

The product is an engine-interpretability web workspace. Search traces and
network experiments follow trustworthy engine evidence. Tutoring, coaching,
profiles and spaced repetition are excluded. Multi-user accounts and
game-service imports are not required for this repair release.
No desktop scaffold, native sidecars or OS-keychain promise belongs in it.
Tutoring, drills and learner profiles are outside the product scope permanently
unless the owner explicitly changes that scope.

## Release implementation status

The six repair groups are implemented or retired as described in
AUDIT-STATUS.md. Cache/storage code was removed rather than replaced with a
new durable cache; provider requests and evidence remain transient. Search
traces and same-root comparisons extend the initial fact contract. Tests,
CI and demo artifacts now exist. Remaining browser/provider/dependency limits
are explicit; production promotion waits for owner preview review.
