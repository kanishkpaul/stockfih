# Decisions

## 2026-10-16: Keep the rebuild local and work on the web app

The owner requested deleting GitHub's `new` branch while preserving it
locally. `new=13db5f9` is retained locally, with an explicit backup of the
stale local main and a verified temporary git bundle. GitHub now has only
`main`, containing the Next.js application. Do not push the parked rebuild.

The product is a web app. Retain the existing Next.js/React/TypeScript
foundation and browser Stockfish Worker. This supersedes the desktop,
Tauri/Rust and native-keychain proposals retained on local `new`. Audit and
repair this code before adding interpretability or learning features.

## 2026-10-16: Review and Explore have equal priority

The owner confirmed both game review and position exploration matter
equally. A shared board workspace supports both. Explore remains unbuilt;
do not describe a read-only replay board as free position exploration.

## 2026-10-16: Use an independent minimal design

The owner explicitly requested a clean interface similar to Lichess and
said not to borrow from the design kit. This supersedes the kit requirement
in the parked rebuild and the originally supplied repository guidance.
New styles/components belong to Stockfih. Reference hierarchy and behavior;
do not copy third-party code, branding or assets without reviewing licenses.
The implementation brief is `FRONTEND-DESIGN.md`.

## 2026-10-16: Preserve engine authority and attribution rules

No model computes chess facts, writes learning memory or overrides engine
output. The current prose-only guard is insufficient; the repair plan
requires explicit checked evidence before model output is treated as truth.

Keep MIT for Stockfih and the existing separately delivered Stockfish
exception. No new GPL/AGPL dependency is approved by this entry. Web delivery
does not eliminate Stockfish's own distribution/source obligations.

Main's six existing commit messages have no Claude/AI trailers. Avoid an
unnecessary history rewrite. Restore the existing rebuild's attribution
script, commit hook and CI guard to active main. Use the configured human
identity and never bypass the hook.

## Open implementation choices

Classification thresholds need calibration and a dated decision when WDL
fixtures are available. Hosting/access policy, direct local-model support,
piece assets and optional future IndexedDB persistence need implementation
evidence. The audit plan does not claim those choices have shipped.

## 2026-10-16: Interpretability first; BYOK and local explanations

The owner redirected the product from tutoring toward engine interpretation.
Every played move and every PV ply should be inspectable. Review and Explore
remain equal workflows. Drills, profiles, Socratic prompts and Human/Maia
are parked. Search traces and chess evidence precede optional NNUE work.

The first slice uses direct browser OpenAI-compatible requests. Keys remain
in tab memory and go only to the chosen endpoint. No persistent cache,
shared-token proxy, automatic calls or silent remote fallback. Browser
CORS/local-network policy is a compatibility constraint. The legacy route
returns 410 and no longer uses HF_TOKEN/HF_MODEL.

AI selects and orders deterministic fact IDs; code renders those facts.
Unverified prose is rejected. Richer explanations wait for tested chess
evidence and a validated claim contract. PV/root scores are not separate
evaluations of every ply or causal explanations of network internals.
Requests are explicit, cancellable and output-bounded.

## 2026-10-16: Interpretability only; no tutoring roadmap

The owner clarified that Stockfih is exclusively an engine-interpretability
project. This supersedes every earlier mention of tutoring as primary,
secondary, optional, parked or future work. Coaching, quizzes, drills,
Socratic prompts, learner memory and profiles are excluded from the product.

AI remains a BYOK/local-compatible explanation interface for measured engine
and chess evidence. Explaining a played move or Stockfish continuation is
interpretation of that evidence, not a tutoring feature. Review and Explore
are inspection workflows; search traces and network experiments deepen
interpretability. Historical audit records retain their original wording.

## 2026-10-16: Replace the legacy explanation controls

Mount the move inspector in the existing analysis panel, retire the old
shared-token route and template module, and remove the persistent
explanation cache. Keep model configuration in the inspector's tab memory.
Collapse import and remove the promotional header/feature cards so the
workspace leads. This is an incremental interface change; the complete
neutral theme and synchronized board inspection remain release work.

## 2026-10-16: Establish reproducible release checks

Pin the patched framework/lint pair and engine, verify engine asset hashes
and stable modes, use system fonts, and run lint/type/unit/build plus a real
Chromium engine smoke test in CI. Track the remaining development-only
upstream glob advisory in DEPENDENCIES.md instead of downgrading the framework.

Production builds use Next's supported Webpack option. The upgraded
Turbopack's internal build socket is denied in the managed development
environment; Webpack builds without that dependency and without font fetches.

## 2026-10-16: Retire cancelled workers and serialize analysis

Use a single serialized engine lane first. A cancelled/timed-out/crashed
worker is terminated instead of reusing its undrained UCI stream. The next
job creates and handshakes a new worker. Game runs own AbortControllers;
new imports and unmount abort them. Fixtures and controlled timers test
serialization, late output, startup/readiness failures, crash and recovery.

## 2026-10-16: Use explicit terminal states and outcome-based labels

Normalize scores and UCI WDL to White. Parse terminal scores independently
of PV and derive the winner/draw reason from legal chess state. Label moves
by mover expected-score loss: <=1% Best, <=3% Excellent, <=7% Good,
<=12% Inaccuracy, <=20% Mistake, otherwise Blunder; missing evidence is
Unavailable, and newly allowing forced mate is explicit. These are
transparent UI bands, not empirically calibrated measures of human skill.
Keep cp swings as a separate descriptive statistic only when both scores
are cp. Drop Brilliant/Great heuristics and artificial mate centipawns.
Preserve real FEN fullmove numbering and en-passant captures. UCI regression
fixtures are captured from the pinned engine with UCI_ShowWDL enabled.

## 2026-10-16: Ship one synchronized Review/Explore workspace

Keep the imported game intact when exploring alternatives. Store variation
positions and a cursor, with redo discarded only on a new branch. Make
inspection select a before-FEN and legal move so board/arrow/evidence agree;
allow a resulting-position toggle. Use a flat neutral board/rail interface,
local assets and keyboard UCI entry alongside drag/click. Promotion is an
explicit choice. Controls and labels are shared across desktop and phones.

## 2026-10-17: Interpret observed search and same-root alternatives

Retain actual UCI depth observations rather than narrating an imagined search
process. Make every reported line inspectable by legal replay. Record nodes,
time and pinned engine/options in exportable snapshots. Compare a selected
move with unrestricted search by clearing history and running both at the same
root/depth/options, restricting only the second root via searchmoves. State
finite-depth limitations and expose the searched reply as a continuation.
This fulfills search interpretation; NNUE causal attribution remains outside
this release. Export contains engine evidence only, never AI connection state.

## 2026-10-17: Enrich facts while keeping narration constrained

Add legally replayed searched replies, White-perspective root WDL, material
counts and geometric attacks by the moved piece. Explicitly distinguish
attacks from profitable captures, material from evaluation, and WDL from
calibrated game probabilities. Models still select existing fact IDs only;
unknown references and free prose fail visibly. Same-root comparisons supply
concrete alternative/refutation evidence without inventing a tactical cause.
Verified the browser interface against the Mac's cached Qwen3-VL-8B-Instruct
Q4_K_M via llama.cpp on loopback, without a key. The owner waived live hosted
BYOK testing; transport/credential/checker behavior is covered by tests.

## 2026-10-17: Distribute the existing engine's corresponding source

Serve the pinned Stockfish.js source revision and required lite NNUE weight
alongside the unmodified WASM, binary hashes, GPL license, upstream notices
and build instructions. No new GPL dependency is introduced. The source
archive is a release artifact, not application implementation. Record that
a byte-identical local compiler rebuild was not performed.


## 2026-10-17: Finish locally without deployment

The owner declined Vercel and deployment. Remove hosted preview/production
from the release finish line; retain the tested local build and demo artifacts.
Stop the Vercel login attempt. No hosted release or remote CI pass is claimed.
The earlier main push was blocked for its possible production-deployment side
effect, and the owner did not approve that risk, so keep these commits local.
