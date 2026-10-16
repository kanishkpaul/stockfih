# Bug audit — 2026-10-16

Audited application: `main` at `1e817f925d25acff43d6d7d3edbda3bbcf0ae570`.
This is the existing Next.js web application, not the parked desktop plan.
This report is a historical baseline. The first interpretability slice
subsequently retired the shared-token route and persistent explanation
cache, added checked evidence selection, and fixed keyboard select handling.
The reproduction script loads TypeScript from this audited commit, so its
observations remain reproducible after current source changes.
All application source, components, configuration, dependencies and git
messages were inspected. This is a bounded audit, not proof that no other
bugs exist. No live model requests or production changes were made.

## Evidence

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` | Successful; locked dependencies installed without lifecycle scripts |
| `npm run build` | Pass; Next.js 16.2.6 production build |
| `npx --no-install tsc --noEmit --incremental false` | Pass |
| `npm run lint` | Fail: 2 errors, 10 warnings in existing app source |
| `npm audit --json` | 14 affected dependency entries: 1 critical, 12 high, 1 moderate |
| `node docs/audit/reproduce.mjs` | 13 distinct defects reproduced; terminal parsing checked for both mate and stalemate |
| Browser smoke check | Sample analyzes successfully; `4.Qxf7#` shows Eval after `N/A` |
| Postinstall script | Reproduced tracked WASM mode changing from 100644 to 100755; restored after inspection |
| Main commit messages | All 6 commits pass the attribution guard; no matching trailers to remove |

`audit/reproductions.json` contains the observations. `audit/stockfish-18.json`
contains real output from the shipped Stockfish 18 lite build, run through
Node with MultiPV 3 at depth 4. Browser smoke testing used default depth 10.
The probe loader transpiles the existing TypeScript without modifying it.
API probes call the real handler with an isolated empty environment so no
provider token can be used. The worker scheduling probe controls timers and
replays actual engine output. Probes assert existing defects and therefore
need replacement with acceptance tests as each fix lands.

Priority: P1 affects result integrity, availability, or safe public hosting;
P2 affects correctness in narrower cases or usability; P3 is maintenance.
R means reproduced, I means confirmed by source inspection. Each row names
the owning code and the failure trigger; the implementation order and
acceptance criteria are in `BUG-FIX-PLAN.md`.

## Findings

| ID | Priority / evidence | Finding and trigger | Owning source |
|---|---|---|---|
| B01 | P1 / R | Explanations cross games: `1.e4 e5 2.Nf3` and `1.d4 d5 2.Nf3` share `2-g1f3:default` despite different FENs. | `lib/chess.ts:40`; `components/StockfihApp.tsx:87,244` |
| B02 | P1 / I | A missing token, provider failure, or client fetch failure is stored indefinitely as a successful cached explanation. Future clicks return the template without retrying. Source is labelled, but failure reason and retry are absent. | `components/StockfihApp.tsx:246,282-300`; `app/api/explain/route.ts:98` |
| B03 | P1 / I | Loading another game resets state but does not stop the old analysis loop. Old results and status overwrite the new game; resetting status also permits a second loop sharing one engine. | `components/StockfihApp.tsx:139-232` |
| B04 | P1 / R | Search timeout clears `pending` without `stop`, draining `bestmove`, or retiring the worker. Late output from that search resolves the next request with the wrong position's result. `isready` does not cancel an active search. | `lib/stockfish.ts:142-171,202-220` |
| B05 | P1 / R+I | Failed startup permanently caches a rejected `initPromise` (R). Readiness has no deadline; a crash after startup rejects an already-settled init promise instead of pending readiness/search work (I). Retry can fail forever or hang. | `lib/stockfish.ts:22-25,68,124-133,175-183` |
| B06 | P1 / R | Terminal scores without PV are discarded. Actual engine output is `score mate 0` for checkmate and `score cp 0` for stalemate, each without PV. Both become unavailable evaluation. Browser confirms N/A on the mating move. | `lib/stockfish.ts:224-229` |
| B07 | P1 / R | Mate in 3 to mate in 5 becomes a 2,000 cp loss and Blunder although the forced win remains. Arithmetic on artificial mate centipawns also breaks comparisons among losing mates. | `lib/classify.ts:9-62` |
| B08 | P2 / R | Allowing mate is represented as hundreds of pawns (mate in 1 maps to 99,000 cp). Mate zero also lacks an explicit winner: numeric `-0` compares as non-negative. | `lib/classify.ts:20-21,118,128,139` |
| B09 | P2 / R | Fixed centipawn thresholds label +10 to +7 a Blunder without measuring expected outcome. Scores at different phases and winning margins are treated alike. | `lib/classify.ts:43-62` |
| B10 | P1 / R | Missing both scores and the best move still produces Good. Incomplete analysis is presented as a confident verdict rather than unavailable. | `lib/classify.ts:50-51` |
| B11 | P2 / R | Setup-FEN PGNs lose their real move number. A game starting with Black on move 23 records `23...e5` as move 1, and the move list puts the first black move in the white column. | `lib/chess.ts:36`; `components/MoveList.tsx:36-43` |
| B12 | P2 / R | En passant is not recognized as a capture: chess.js `isCapture()` excludes its separate en-passant flag. `exd6` has `captured='p'` but `isCapture=false`. | `lib/chess.ts:53` |
| B13 | P1 / R | The API accepts arbitrary FEN, moves, classifications and tones, missing evaluations and invalid score shapes. The type guard checks five strings, then asserts the whole type. Unsupported tone bypasses tone instructions. | `app/api/explain/route.ts:10-23`; `lib/prompts.ts:25` |
| B14 | P1 / R+I | No application body/context limit before JSON parsing. The handler accepts a 1 MiB PGN context (R); hosting platform limits are deployment-dependent (I). | `app/api/explain/route.ts:30` |
| B15 | P1 / I | With `HF_TOKEN` configured, the public route has no application access, concurrency, rate or spending controls. Third parties can trigger use of the owner's token. Exploit cost was not tested. | `app/api/explain/route.ts:47-73` |
| B16 | P1 / I | Model text is displayed without checking named moves or factual claims. The prompt supplies no PV/refutation/motif evidence, so requests for concrete reasons invite unsupported explanations. A system prompt is the only guard. | `lib/prompts.ts:4-34`; `app/api/explain/route.ts:78-96`; `components/AnalysisPanel.tsx:250` |
| B17 | P1 / I | Provider fetch has no timeout or request-abort signal. Client explanation fetch is also never aborted on game change/unmount. A stalled provider leaves loading state pending; abandoned work continues. | `app/api/explain/route.ts:59`; `components/StockfihApp.tsx:264` |
| B18 | P2 / R | Fallback claims the played move matches the engine when `bestMove` is null. Generic fallback prose also asserts threats/ideas without evidence. | `lib/prompts.ts:38-71` |
| B19 | P1 / I | Storage access is not resilient: `setItem` can throw on denied storage/quota, and recovery `removeItem` is itself outside protection. Parsed JSON has no schema; a valid JSON `null` can crash later indexing. No eviction bounds growth. | `components/StockfihApp.tsx:55-75,89` |
| B20 | P2 / I | Changing analysis depth and reanalyzing does not invalidate explanations. Cache identity omits engine version, evidence, depth, model and prompt version, so old prose can contradict fresh analysis. | `components/StockfihApp.tsx:87,169-177,244-247` |
| B21 | P2 / I | One `explainingKey` tracks every request. Changing moves/tones permits overlapping requests; an older request's `finally` clears the indicator for the newer one. Duplicate/in-flight work is not deduplicated. | `components/StockfihApp.tsx:71,261-303,390-392` |
| B22 | P2 / I | Global left/right navigation ignores inputs and textareas but not the depth select or modified keys. Changing a select using arrow keys can also navigate the board. Default browser scrolling is not prevented when navigation is handled. | `components/StockfihApp.tsx:92-110` |
| B23 | P2 / I | PGN textarea has no accessible name; error messages and analysis progress lack alert/status/progress semantics. Selected move lacks `aria-current` and is not scrolled into view during keyboard navigation. | `components/PgnInput.tsx:51-64`; `components/AnalysisPanel.tsx:125-139`; `components/MoveList.tsx:73-94` |
| B24 | P2 / R | Lint fails: mutable `raw` should be const and worker error uses `any`; ten warnings include obsolete suppressions and an unused catch binding. | `lib/stockfish.ts:73,78,126`; `components/StockfihApp.tsx:180-190` |
| B25 | P1 / R | Locked dependencies have current advisories. Next.js is flagged critical; other entries include build/lint dependencies. This is a dependency finding, not evidence every advisory is reachable here. | `package.json`; `package-lock.json`; `audit/npm-audit.json` |
| B26 | P3 / R+I | Postinstall dirties a tracked WASM executable bit (R), copies an unused 10.5 MB asm engine, and exits successfully if all engine assets are missing (I). A successful install can mask a broken runtime asset build. | `scripts/copy-stockfish.mjs:10-28`; `public/stockfish/` |
| B27 | P2 / R | GitHub main's README describes itself as frozen, tells users to switch to a remote `old` that does not exist, and points to a desktop rebuild supposedly on main. Branch state no longer matches documentation. | `README.md` at audited SHA |
| B28 | P2 / I | No application test suite, test command, aggregate `check`, or application CI exists. Passing build does not test engine lifecycle, chess verdicts or user flows. Attribution enforcement was also absent on this main and is restored with this audit. | `package.json`; repository file inventory |
| B29 | P2 / I | Great is awarded simply for an engine-best capture/check/castle; Brilliant simply for best-move checkmate. These labels make unsupported quality claims. In the browser the sample mate is labelled Brilliant even with its final evaluation absent. | `lib/classify.ts:67-73` |

## Product gaps, not regressions

- Explore cannot yet load a FEN, edit a position or play legal moves: the board explicitly disables dragging. Review and Explore must be equal first-class flows in the new brief.
- The current page puts a large pitch, feature cards and the PGN form before the board. Its desktop grid reserves 360px plus at least 340px for side panels, squeezing the board near the breakpoint. This is a design limitation, not a reproduced crash.
- No games/profile/drill persistence, interpretation lenses, Maia integration or independent claim checker exists. The parked desktop plan is not implementation evidence.
- Worker disposal, bounded cache size, large-PGN responsiveness, offline behavior, cross-tab storage, Safari/mobile behavior and accessibility need dedicated regression coverage. Only the sample browser path was exercised.
- The API trusts browser-supplied evaluations. If explanations are saved or shared as verified results, provenance must be tied to locally checked engine evidence or server recomputation. Current payloads cannot establish that provenance.

## Dependency interpretation

The audit snapshot is dated, not a permanent upgrade prescription. npm
currently proposes Next.js 16.4.2. Its suggested eslint-config downgrade to
14.2.35 would cross framework generations; do not run `npm audit fix --force`.
Choose a supported matched framework/lint release, refresh transitive
packages and re-audit. Investigate runtime reachability separately from
development-only findings. No dependency version was changed in this audit.

## Git operations completed

GitHub initially had `main=1e817f9` and `new=13db5f9`. Stale local main was
the latter. Local `new` and `backup/local-main-2026-10-16` preserve that exact
rebuild tip. A verified all-refs bundle was written to
`/private/tmp/stockfih-before-cleanup-2026-10-16.bundle` as an extra temporary
backup; the persistent local branches are the primary preservation.

Local main was aligned only after this preservation. GitHub `new` was
deleted with an expected-tip lease. A fresh remote listing then showed
only `main=1e817f9`. Main's six existing messages have no AI attribution;
no content or commit history rewrite was necessary. Local branches are not
off-device backups; do not push `new` or use `git push --all`.
