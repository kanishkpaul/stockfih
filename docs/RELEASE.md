# Finish line: Stockfih v1

Purpose: ship a working engine-interpretability web app that demonstrates
end-to-end engineering. This is a bounded release, not an open-ended research
program. Tutoring, coaching, drills and learner profiles are excluded.

## What v1 must do

1. **Reliable analysis.** Import PGN or FEN, run browser Stockfish, cancel,
   retry after worker failure and change positions without stale results.
   Handle mates, draws, promotions, castling, en passant and setup PGNs.
   Fix the dependency/lint baseline and engine/classification defects first.
2. **A complete inspection workspace.** Review any played move, explore
   legal alternatives, traverse every PV ply and keep board, arrows,
   score, selected move and explanation on the same position. Make the
   minimal independent frontend work on desktop and mobile.
3. **Actual search interpretation.** Show candidate evaluations by depth,
   preferred-move changes and searched refutations. Compare a played move
   with engine alternatives using explicit counterfactual searches. Include
   engine version, settings and position provenance in an exportable trace.
   A move description or a fluent model answer alone does not satisfy this.
4. **Useful checked explanations.** Explain every game move and engine/PV
   move from richer tested evidence. Keep BYOK/local compatibility and
   bounded on-demand requests. Verify one real hosted and one real local
   setup, including their browser-origin requirements. The current fact-ID
   selector is an initial contract, not the finished explanation experience.
5. **Release quality.** Fresh install, lint, typecheck, tests, build and CI
   pass. Browser tests cover the primary workflows and cancellation races.
   Resolve release-relevant audit findings; record remaining limitations
   explicitly rather than treating the historical audit as current status.
6. **A public demonstration.** Deploy the app with a sample position/game
   that works immediately without a model key. Publish a short demo,
   screenshots, architecture overview, setup instructions and an honest
   explanation of the engineering tradeoffs and measured limitations.

## What the portfolio should demonstrate

The main story is ownership of the whole system: asynchronous worker and
UCI lifecycle, typed chess/evidence boundaries, measurable search traces,
constrained model integration, responsive UI, regression tests, CI and a
usable deployment. Let the running product and reproducible artifacts carry
that story. No invented performance numbers or claim of reading Stockfish's
internal reasoning.

## Scope boundary

Ship v1 as search interpretability. NNUE interventions are a separate,
optional follow-up after a bounded feasibility check on the shipped WASM
build; they do not block this release. Maia, accounts, social features,
training workflows and more provider integrations are not release gates.

Finish when the six items above work in the deployed application and the
documented local model setup, with their checks passing. At that point tag
the release and stop expanding v1. Reopen scope only for a concrete defect
or an explicit new version request.

## Next implementation task

Take the foundation repairs in `BUG-FIX-PLAN.md` groups 1–3 in order. The
first increment establishes passing lint/typecheck/tests/build and app CI,
updates vulnerable dependencies, and makes engine asset installation
reproducible. Then repair worker cancellation/recovery and chess truth
before adding search-trace features.
