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

Next.js/React, TypeScript, chess.js and browser Stockfish. PGN review exists.
The first interpretation slice exposes checked movement and engine-line
facts for game moves and all PV plies. AI selects and orders fact references;
unverified generated prose is not displayed. Requests are on demand.
Keys live only in tab memory and go directly to the chosen endpoint.

Free FEN exploration, search-depth traces, motif evidence and NNUE
interventions are future work. Known engine/classification bugs remain.
BYOK/local transport is tested with mocks; live endpoints were not called.
Browser CORS and private-network permissions constrain compatibility.

## Brand Commitments

Stockfih: clean and minimal, like Lichess, independent of the design kit.
The board and evidence lead; AI is an optional interpretation layer.

## Evidence and Open Decisions

`docs/BUG-AUDIT.md` records the original SHA and 29 findings.
`tests/interpretation.test.mjs` verifies the initial evidence/client contract
against captured Stockfish output. The desktop plan stays on local `new`.
Production hosting, a restricted relay for providers without browser CORS,
and richer validated natural-language explanations remain open decisions.
