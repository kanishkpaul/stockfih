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
   bounded on-demand requests. Verify a real local setup and test hosted BYOK transport/checking; the
   owner waived live hosted calls. Document browser-origin requirements. Checked facts include move effects, searched replies, root outcomes and
   same-root comparisons; free causal prose remains outside the contract.
5. **Release quality.** Fresh install, lint, typecheck, tests and build
   pass; CI is configured to repeat these checks when published. Browser tests cover the primary workflows and cancellation races.
   Resolve release-relevant audit findings; record remaining limitations
   explicitly rather than treating the historical audit as current status.
6. **A reproducible demonstration.** Run locally with a sample position/game
   that works immediately without a model key. Include a short demo,
   screenshots, architecture overview, setup instructions and an honest
   explanation of the engineering tradeoffs and measured limitations.

## What the portfolio should demonstrate

The main story is ownership of the whole system: asynchronous worker and
UCI lifecycle, typed chess/evidence boundaries, measurable search traces,
constrained model integration, responsive UI, regression tests, CI and a
runnable demonstration. Let the running product and reproducible artifacts carry
that story. No invented performance numbers or claim of reading Stockfish's
internal reasoning.

## Scope boundary

Ship v1 as search interpretability. NNUE interventions are a separate,
optional follow-up after a bounded feasibility check on the shipped WASM
build; they do not block this release. Maia, accounts, social features,
training workflows and more provider integrations are not release gates.

Finish the implementation when the six items above work in the local
application and documented local model setup, with their checks passing.
Deployment is excluded at the owner's request on 2026-10-17. Stop expanding v1;
publication and release tagging remain separate owner decisions. Reopen scope only for a concrete defect
or an explicit new version request.

## Implementation evidence

Milestones 1–4 are implemented: engine lifecycle/chess truth, independent
Review/Explore, depth/counterfactual/export evidence and richer checked facts
with a real local model. Milestone 5 is covered by the release checks and
AUDIT-STATUS.md; remote CI has not run for the unpublished local commits.
Milestone 6 has DEMO.md, screenshots/recording and a runnable local build.
The owner declined deployment; no Vercel authentication is required.
See VALIDATION.md for checked evidence and publication status.
