<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working on Stockfih

Stockfih is a Next.js chess web app. `main` is the active web application;
the desktop rebuild is parked on local `new`. Never push `new` or use
`git push --all`. The owner explicitly superseded the desktop and shared
design-kit directions on 2026-10-16.

Read `docs/STYLE.md` before code, `docs/BUG-FIX-PLAN.md` before choosing a
task, and `docs/ARCHITECTURE.md` plus `docs/DECISIONS.md` before changing
boundaries. Finish one repair group with meaningful regression tests before
starting the next. Follow the style checklist before every commit.

## Rules

- No AI co-author trailers, generated-by lines or other AI attribution in git, PRs, tags or releases. Use the configured human git identity; never bypass the commit hook.
- The engine decides; the model narrates checked facts. Every named move goes through a claim checker. No model modifies engine evidence or overrides engine output. The current AI selects checked evidence references only; free-form causal prose must wait for stronger claim checking.
- Features import only from `src/core/`, never another feature; core never imports features. These are the target boundaries for gradual repairs. Existing `components/` and `lib/` are legacy code, not a reason for a wholesale rewrite.
- No new GPL/AGPL dependencies without an owner-approved dated decision. Stockfish is the existing exception. Never assume a reference site's code/assets may be copied.
- No secrets in git. BYOK keys stay in tab memory and go only to the chosen provider. Never persist keys, embed them in bundles, export them or log them. A normal web app cannot promise OS-keychain integration.
- UI work follows `docs/FRONTEND-DESIGN.md`: minimal, board-first, like Lichess. Use project-owned styles and components, with no shared design-kit imports, skins or tokens. Ship fonts, scripts and icons locally.
- Engine protocol fixtures come from the pinned Stockfish build, never invented UCI lines. Pure chess positions and classifier inputs may be authored.
- Record design/boundary changes in architecture and a dated decision together. Do not claim unfinished fixes, future features or proposed checks are implemented.

## Commands

```bash
git config core.hooksPath .githooks
npm ci
npm run dev
npm run lint
npx --no-install tsc --noEmit --incremental false
npm test
npm run build
node docs/audit/reproduce.mjs
git log main --format=%B | sh scripts/check-attribution.sh
```

The audit probes reproduce existing defects; they are not acceptance tests
for repaired behavior. `npm test` covers the first interpretability slice; `npm run check` does not exist yet. Baseline lint failures are recorded in `docs/BUG-AUDIT.md`.

Interpretability is the sole product scope. Every game move and every Stockfish
candidate/PV move should be inspectable. AI is an optional BYOK/local
explanation interface for engine evidence. Tutoring, coaching, quizzes,
drills and learner profiles are excluded, not parked for later. See `docs/PLAN.md`.
