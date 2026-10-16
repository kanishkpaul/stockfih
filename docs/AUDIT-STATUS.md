# Release audit disposition

The original audit at 1e817f9 is preserved in BUG-AUDIT.md. Its probes load
that historical source, so reproducing an old defect is not a current failure.
This is a bounded regression review, not a claim that all possible bugs are gone.

| Findings | Current disposition | Evidence |
|---|---|---|
| B01, B02, B19, B20 | Persistent explanation cache/storage removed. Transient answers use full target/evidence/config identity; errors retry visibly. | interpretation unit + browser credential/output tests |
| B03 | Replacement/navigation cancels runs; aborted runs cannot publish. | real-worker replacement/cancel browser tests |
| B04, B05 | Serialized UCI lane, all deadlines, worker retirement and retry. | engine lifecycle tests with captured output and controlled clocks |
| B06, B08 | Terminal scores parse without PV, mate winner explicit, no mate-to-cp conversion. | real terminal fixtures, both winners and stalemate |
| B07, B09, B10, B29 | WDL expected-score loss, explicit mate transition, missing evidence unavailable; unsupported Brilliant/Great removed. | classifier regressions; transparent UI thresholds in DECISIONS |
| B11, B12 | FEN fullmove/color preserved; en passant recognized. | setup PGN, castling, promotion and capture tests |
| B13, B14, B15 | Shared-token API retired (410), without body parsing or provider call. Import limited to 200 KB. | route/source review; no app-server provider code |
| B16, B18 | Checked fact IDs only; unknown references/free prose rejected. No fabricated fallback. | checker adversarial tests and browser rejection |
| B17, B21 | Abort on identity/config change; one current request indicator; timeout and retry. | unit transport/abort + browser stale-output tests |
| B22, B23 | Form-aware keyboard navigation, labels/status/progress/current move/focus; mobile tabs and promotion choices. | real browser Review/Explore and layout tests |
| B24, B28 | Passing lint/types/unit/build, real browser regressions and application CI added. | npm run check; npm run test:browser; workflows |
| B25 | Runtime audit clean. One upstream development-only braces advisory remains through lint tooling. | npm audit --omit=dev; DEPENDENCIES.md |
| B26 | Pinned hash-verified assets, stable modes, missing files fail install, unused asm removed. | installation tests; fresh npm ci |
| B27 | Main docs describe the working web app and local-only parked branch. | README, PLAN, RELEASE, architecture |

## Explicit limits

- Chromium/macOS is exercised locally; CI runs Chromium/Linux. Native Safari,
  Firefox and physical phone behavior have not been verified. Responsive tests
  cover 360/768/1440 CSS pixels and 200% zoom.
- Hosted BYOK live calls were waived by the owner. Tests verify request destination,
  transient keys, cancellation and checked output. A cached local Qwen model
  passed the real browser flow. Browser origin/private-network policy still applies.
- Finite-depth lite Stockfish is weaker than the full engine. WDL and outcome
  labels are descriptive engine/UI measures, not empirically calibrated human
  probabilities. Search evidence is not mechanistic NNUE attribution.
- FEN snapshots cannot preserve repetition history. Threefold-repetition claims
  are not reconstructed by position-only engine searches. PGN variations/comments
  are not an editable study tree; imported main lines stay immutable.
- Engine source and lite weights accompany the binaries. A byte-identical local
  Emscripten rebuild has not been performed. There is no offline service worker,
  account system, database, game-service import or secret persistence.
- Deployment was declined by the owner. The demo runs locally; remote CI has
  not run for the unpublished implementation commits. No hosted release is claimed.
