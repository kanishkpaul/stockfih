# Interpretability roadmap

Inspect what Stockfish finds, how search changes, and which measured
evidence supports a move. AI explains engine evidence using the user's
own hosted key or local model. It is not the source of chess facts.
Interpretability is the entire product scope.

The owner's delivery goal is a finished project that demonstrates building
and shipping to recruiters. `RELEASE.md` defines the bounded v1 acceptance
criteria: search interpretability, reliable analysis, complete inspection,
BYOK/local explanations, release checks and a public demonstration.

## First slice — implemented

- Inspect the selected game move, even before engine analysis.
- After analysis, select every ply in each Stockfish candidate line. Replay
  each legally from its own FEN; distinguish root score from per-ply scores.
- Display computed movement, capture, promotion, check/mate, castling,
  en-passant and engine-line facts.
- Configure a compatible base URL, model and optional key. Requests are
  direct from the browser, cancellable, and time out after 30 seconds.
  Keys stay in tab memory. No automatic model calls or persistent cache.
- Models select checked fact IDs, never arbitrary prose. Unknown references
  and extra text fail visibly. Send only selected-move evidence and cap
  output at 120 tokens.
- Retire the shared-token server endpoint (410).

This is evidence inspection and constrained narration, not mechanistic
interpretability or a complete account of why a move is best. Provider
transport is tested with mocks, not live endpoints. Browser origin/private
network policies must permit each connection.

## Next: trustworthy engine evidence

Complete `BUG-FIX-PLAN.md` groups 1–3: dependencies, engine lifetime,
cancellation/generation ownership, terminal states, WDL and classification.
These gate deeper interpretation. Then bind the inspected PV ply to the
board and add FEN exploration/variation navigation with stable provenance.

## Then: search interpretation

Capture candidate scores, bounds, nodes and actual depth over time. Show
where the preferred move switches, when a refutation appears and when a
score stabilizes. Explain measured differences with trace references;
search traces do not establish a cognitive reasoning process.

## Then: chess facts and optional network experiments

Add tested threat/refutation and tactical/positional features, including
counterfactual engine searches for alternatives. Expand narration's fact
vocabulary with tests. Investigate NNUE interventions only after checking
what the shipped WASM build exposes. Static eval is not piece attribution;
piece-removal experiments are not causal truth.

NNUE work is optional after v1; it does not hold the search-interpretability
release open. Finish and demonstrate the release before expanding scope.

Tutoring, coaching, drills, Socratic prompts, learner memory and profiles
are excluded from the product. They are not future roadmap items. Human/Maia
is not part of this engine-interpretability roadmap.
Keep Review and Explore usable independently of any model.
