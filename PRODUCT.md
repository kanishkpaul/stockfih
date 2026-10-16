# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and Purpose

Chess players inspecting their games and Stockfish's analysis. Review and
position exploration have equal priority. Stockfih is exclusively an engine
interpretability tool. Tutoring, coaching, quizzes, learner profiles and
drills are excluded from the product, not deferred features.

The owner's delivery goal is to finish and ship a working project that
demonstrates engineering ability to recruiters. V1 is bounded search
interpretability, with explicit acceptance criteria in `docs/RELEASE.md`.

## Mechanism

Every game move and every Stockfish PV ply should be inspectable in its own
position. Engine evidence comes first. Optional AI explains that evidence
through a user-selected hosted BYOK or local compatible model. A principal
variation is searched evidence, not a causal account of network internals.

## Current Capabilities

Next.js/React, TypeScript, chess.js and browser Stockfish. PGN/file Review and
FEN Explore support legal moves, promotions, navigation and independent branches.
Every game/PV ply has a synchronized before/result board and checked facts.
Search depth observations, same-root restricted alternatives and JSON traces
carry engine build/settings provenance. Models select checked evidence IDs;
keys stay in tab memory. The local Qwen/llama.cpp browser flow is verified;
hosted BYOK live calls were waived. Regression checks and CI cover the main
flows. Browser origin/private-network policy remains a compatibility limit.
NNUE interventions are outside v1. See docs/AUDIT-STATUS.md for known limits.

## Brand Commitments

Stockfih: clean and minimal, like Lichess, independent of the design kit.
The board and evidence lead; AI is an optional interpretation layer.

## Evidence and Open Decisions

`docs/BUG-AUDIT.md` records the original SHA and 29 findings.
`tests/interpretation.test.mjs` verifies the initial evidence/client contract
against captured Stockfish output. The desktop plan stays on local `new`.
Production hosting, a restricted relay for providers without browser CORS,
and richer validated natural-language explanations remain open decisions.
