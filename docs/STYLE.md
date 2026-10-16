# How Stockfih code is written

Every person and agent writing code here follows this guide. It is short on
purpose: each rule is here because breaking it makes the code harder to read
or change. When the guide is silent, match the code around you. When the code
around you is wrong, fix it in a separate commit.

Code is read far more often than it is written. Optimize for the next reader,
who knows chess and programming but not what you were thinking.

This guide was preserved from the parked rebuild. The active implementation
is React/Next.js. Apply the general, TypeScript, test and commit rules here;
the Svelte and Rust sections apply only if those languages are introduced
by a later approved decision. Match React's hook rules and read the bundled
Next.js documentation as directed by `AGENTS.md`.

## Taste

**Make the special case disappear.** Before adding a branch for an edge case,
ask whether the problem can be framed so the edge case is the normal case.
Torvalds' linked-list example is the classic: removing the head node needs no
special branch if you walk a pointer to the link rather than to the node. Here,
the same idea means "no position" and "start position" should not be two code
paths; a checkmated position should flow through scoring like any other.

**Make illegal states unrepresentable.** Use discriminated unions instead of
optional fields that are only valid together.

```ts
// Bad: nothing stops { type: "mate", cp: 35 }
type Score = { type: "cp" | "mate"; cp?: number; mate?: number };

// Good
type Score = { kind: "cp"; cp: number } | { kind: "mate"; plies: number };
```

**Parse, don't validate.** Turn untrusted input (UCI lines, PGN, model output,
HTTP responses, rows from disk) into typed values once, at the boundary. Past
the boundary, code trusts its types and does not re-check them.

**Deep modules, small interfaces.** A module should hide a lot behind a little.
`engine.analyze(fen, { depth })` hiding the UCI handshake, queueing, caching,
and cancellation is deep. A wrapper that renames one function is shallow and
should not exist.

**Solve today's problem.** No options nobody passes, no abstraction with one
implementation "for later", no config for values that never change. The
feature system in `docs/ARCHITECTURE.md` is the only planned extension point;
do not invent others.

**Fail loudly at the right level.** Never swallow an error to make a screen
look fine. Catch an error only where you can do something useful with it:
retry, fall back *and tell the user*, or show it. A fallback the user can't
see is a lie (v1 cached a template as if the model had answered).

**Keep functions doing one thing at one level of abstraction.** If a function
needs section comments to be readable, it is several functions.

**Delete dead code.** Git remembers. No commented-out code, no unused exports,
no `_unused` parameters, no "kept for reference".

## Naming

Names should say what a thing *is* in the domain, as short as the scope
allows. Bob Nystrom's rules, applied:

- **Leave out the type.** `moves`, not `moveList` or `movesArray`.
- **Leave out what parameters already say.** `classify(move)`, not
  `classifyMoveFromMoveAnalysis(move)`.
- **Leave out words that don't distinguish.** `best`, not
  `bestEngineRecommendedMove`, unless something else nearby is also "best".
- **Leave out what the enclosing module says.** Inside `engine/`, it's
  `queue`, not `engineQueue`.
- **No filler words:** `data`, `info`, `value`, `manager`, `handler`, `helper`,
  `util`, `item`, `obj`, `thing`. If removing the word keeps the meaning,
  remove it.
- **Use chess words correctly.** A *ply* is one side's move; a *move* in move
  numbering is both. *FEN* is a position, *SAN* and *UCI* are move notations,
  *PV* is a principal variation, *WDL* is win/draw/loss. Do not use "turn",
  "step", or "board state" where a chess term exists.
- **Booleans read as facts:** `isCheck`, `hasCastled`, `canUndo`.
- **Short names in short scopes are fine.** `sq` in a three-line loop over
  squares is clearer than `currentSquareBeingInspected`.

## Comments

Comments explain what the code cannot: *why* it is this way, what the domain
means, and what a reader would otherwise get wrong. If a comment explains
*what* the code does, rewrite the code so it doesn't need the comment.

Write these (from antirez's taxonomy of Redis comments):

1. **Interface comments** on exported functions, types, and modules whose
   contract isn't obvious from the signature: what it promises, units, what
   it does on bad input, side effects. Skip them when the name and types say
   it all.
2. **Design comments** at the top of a file that does something non-obvious:
   the approach, and why the simpler one was rejected.
3. **Why comments** on lines whose purpose would surprise a reader.
4. **Teacher comments** where the domain is unfamiliar: UCI quirks, NNUE
   output, FSRS scheduling, how WDL maps to expected score.
5. **Checklist comments** when a change here requires a change elsewhere and
   the two can't be merged into one place.

```ts
// Stockfish reports scores from the side to move. We store White's view so
// scores from consecutive plies can be subtracted directly.
const white = sideToMove === "w" ? score : negate(score);
```

```rust
// Stockfish prints `info depth 0 score mate 0` with no `pv` for a mated
// position, so a missing PV is not a parse error here.
```

Do not write these:

- **Narration.** `// increment the counter`, `// return the result`,
  `// call the API`.
- **Change history.** `// updated to use the new cache`, `// fixed bug`,
  `// was X before`. That belongs in the commit message.
- **Section banners and step lists.** `// ===== Helpers =====`,
  `// Step 1: parse`. Split the code instead.
- **Agent-to-reader chatter.** `// Note: we need to make sure that...`,
  `// This is important!`, `// You can customize this`.
- **Placeholders.** `// TODO: implement`, `// Add more cases as needed`. Either
  do it or write a tracked issue. A TODO is allowed only with a reason and an
  owner, e.g. `// TODO(kanishkpaul): drop once Stockfish 19 fixtures land`.
- **Doc comments that repeat the signature.**
  `/** Gets the FEN. @returns the FEN */ getFen(): string`.
- **Lint suppressions without a reason.** `// eslint-disable-next-line` must
  say why on the same line.

Comment style: full sentences, plain words, present tense, no emoji, no
ALL-CAPS shouting. Keep comments next to the code they describe and update
them in the same change as the code. A stale comment is worse than none.

## Habits to avoid in AI-written code

Coding agents have recognisable bad habits. Check your diff for each one
before you commit.

- Comments on almost every line, or comments that restate the line below.
- `try`/`catch` around code that cannot throw, or catches that log and
  continue as if nothing happened.
- Defensive checks for things the types already rule out
  (`if (!move) return` when `move: Move` is not optional).
- Generic names: `data`, `result`, `response`, `handleClick2`,
  `processItems`.
- New helper files or abstractions used once.
- Config options, flags, or parameters nobody asked for.
- `console.log` and debug output left in.
- Rewriting or reformatting code unrelated to the task.
- Re-declaring types that already exist in `core/`.
- Tests that assert the implementation instead of behaviour, or that mock the
  thing under test.
- Wrapping a library call in a function with the same name and arguments.

## Language notes

**TypeScript**
- `strict` on. No `any`; use `unknown` and narrow at the boundary.
- Prefer plain functions and object types over classes. Use a class only when
  something owns a lifetime (the engine connection, the job queue).
- Named exports only. One module, one purpose. File name = what it exports,
  in `kebab-case.ts`.
- `async`/`await` over raw promise chains. Every promise is awaited, returned,
  or explicitly fire-and-forget with `void` and a reason.

**Svelte 5**
- Runes only: `$state`, `$derived`, `$props`, `$effect`. No legacy `$:` or
  `export let`.
- Use `$derived` for anything computable; reach for `$effect` only to sync
  with the outside world (the board library, the engine, the DOM).
- Components render. Logic lives in `.ts` modules next to them, where it can
  be unit tested.
- Keep state as local as possible; lift it only when two components need it.

**Rust**
- `cargo fmt` and `cargo clippy -- -D warnings` clean.
- Errors with `thiserror` in library code, propagated with `?`. No `unwrap()`
  outside tests and startup code that should crash.
- The Rust side is plumbing (process, network, secrets, files, inference). If
  you are writing chess logic in Rust, it belongs in TypeScript.

## Tests

- Test behaviour through public interfaces, not private helpers.
- Use real Stockfish output as fixtures (`tests/fixtures/uci/`), captured from
  the engine version we ship, never hand-written lines.
- Name tests as facts: `"mate in 3 to mate in 5 is not a blunder"`.
- One reason to fail per test.

## Commits

- Imperative subject under 72 characters: `Add WDL-based move classification`.
- The body explains *why* when the diff doesn't make it obvious.
- One logical change per commit. Formatting-only changes go in their own
  commit.
- **No co-author or "generated with" lines from any AI tool, ever.** See
  `AGENTS.md`.

## Before you commit

Read your own diff top to bottom as a reviewer would, and ask:

1. Could any branch be removed by framing the problem differently?
2. Does every comment say something the code can't?
3. Would each name make sense to someone who has never seen this file?
4. Is there anything here the task didn't need?
5. Do the tests fail if the behaviour breaks?

## Sources

- John Ousterhout, *A Philosophy of Software Design*, 2nd ed.: deep modules,
  comments that describe what isn't obvious from the code.
- Salvatore Sanfilippo (antirez), "Writing system software: code comments":
  http://antirez.com/news/124
- Google Engineering Practices, "What to look for in a code review":
  https://google.github.io/eng-practices/review/reviewer/looking-for.html
- Bob Nystrom, "Long Names Are Long":
  https://journal.stuffwithstuff.com/2016/06/16/long-names-are-long/
- Linus Torvalds on good taste (TED 2016), explained with code:
  https://github.com/mkirchner/linked-list-good-taste
- Alexis King, "Parse, don't validate" (2019).
