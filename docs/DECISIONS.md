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
