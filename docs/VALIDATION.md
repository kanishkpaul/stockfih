# Release-candidate validation — 2026-10-17

Validated implementation commit: dd64d24, with preceding milestone commits
9bd70e5, 464fc5f, ba00395, 584ee28, 82cfebf and f1f22bc.

| Gate | Result |
|---|---|
| Fresh npm ci | Pass; binary diff identical before/after install |
| Lint and strict TypeScript | Pass |
| Unit regressions | 35 passed |
| Webpack production build | Pass |
| Chromium acceptance | 14 passed with local-model and demo flags enabled |
| Actual local model | Qwen3-VL-8B-Instruct Q4_K_M, llama.cpp loopback; checked answer rendered without key |
| Runtime dependency audit | 0 vulnerabilities |
| Attribution guard | Pass on every main commit |
| Visual review | Desktop/phone, tablet width, 200% zoom; depth score and mobile comparison cancellation corrected |
| Demo | Production-build real-worker walkthrough, screenshots and instructions committed |

The checks ran on this Mac, not GitHub CI. The new application workflow is
committed. Remote main remains dce3f35 until publication is permitted.

## Publication status

Pushing main was rejected by automatic approval review: an unknown connected
integration could trigger production deployment, conflicting with the owner's
preview-only requirement. No push was performed. Read-only inspection found
only the attribution workflow/check on current remote main, no hooks,
deployments or environments; listing installed GitHub apps was denied (403),
so absence of a production integration could not be established completely.

Vercel CLI 64.4.0 found saved credentials but rejected their token as invalid.
The skill's claimable-deploy endpoint returned instructions to use CLI/login,
without creating a preview URL. The owner subsequently declined deployment; no login renewal is required. No hosted
preview or production deployment is claimed. The production build is available
as a local review preview; no release tag or production promotion was made.
The login attempt was stopped. Deployment is no longer an outstanding task.
The owner did not approve the possible deployment side effect of pushing main,
so the implementation commits remain local.

Known product/browser/dependency limits are in AUDIT-STATUS.md. Hosted BYOK
live calls were explicitly waived by the owner. No secret is included here.
