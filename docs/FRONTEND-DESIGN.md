# Frontend direction: a quiet chess workspace

Status: the Review/Explore workspace and independent neutral theme are
implemented. Search traces and richer explanations follow. Interpretability is the sole scope;
tutoring is excluded from the product.
Platform: web. Mode: operate. Review and Explore have equal priority, as
confirmed by the owner. This direction is independent of the design kit.

## References inspected on 2026-10-16

- [Lichess analysis](https://lichess.org/analysis): primary reference. Inspected in a live browser: large square board immediately under compact navigation, restrained brown board, neutral dark surroundings, compact analysis rail and navigation, FEN below. Borrow the hierarchy and task density, not its code, branding or assets.
- [Lichess study](https://lichess.org/study): secondary information-organization reference for games/chapters, not a reason to add a social platform.
- [Chess.com analysis](https://www.chess.com/analysis): comparison reference for analysis tooling. Only public page content was inspected; no claim of a full authenticated UX review.

Recommendation: follow the familiar Lichess analysis workspace. Stockfih's
distinction is inspected engine evidence with optional checked explanations, not decorative
chrome. The existing application's cyan glass panels, oversized pitch,
badges and feature cards give up space needed by the board.

## First viewport and reading order

A compact header contains Stockfih, Review, Explore, Import and Settings.
The board is visible immediately. Desktop uses two main columns: a large
board with a narrow adjacent evaluation bar, and a 320–380px rail. The rail
contains evaluation/depth/status, candidate lines, a compact move table,
and a move interpretation section. Transport controls sit directly below the board.
At wide sizes an optional game summary may sit to the left; it is never
required, and never squeezes the board into a small tile.

The interpretation panel explains one selected game/PV move at a time. The default section is
collapsed until useful, with a concise Explain control. In Review the
selected move's before/after evidence is explicit; a toggle can show its
before-position rather than drawing a recommendation for a different ply.
In Explore everything refers to the current position.

## Visual system to implement

Project-owned CSS variables describe page, surface, text, muted text,
border, action, focus, board squares and verdicts. Values are authored for
this app when implementation begins; no shared kit values or primitives
are copied. Warm neutral surfaces, a traditional muted tan/brown board,
near-black/ivory pieces, and one restrained green action accent are the
recommended palette. Evaluation uses light/dark plus signed text, never
the action accent. Error/quality colors always have accompanying words.

Use system sans for controls and tabular numerals/monospace where notation
needs alignment. Normal text is 14–16px, headers modest, corners 2–6px.
Fine borders replace nested shadows. Flat panels and compact rows replace
cards. No gradients, glow, glass, marketing hero, trophy skin or celebratory
animation. Assets ship locally; choose a permissively licensed board/piece
set with recorded provenance. Do not copy Chessground or Lichess assets by
assuming visual inspiration grants code or asset permission.

## Interaction and responsive behavior

| Surface | Review | Explore |
|---|---|---|
| Entry | Paste/open PGN; sample available without obscuring board | Start position or paste validated FEN |
| Board | Replay; inspect before/after; branch into Explore | Legal pointer/keyboard moves; explicit promotion choices |
| Moves | Real move numbers, current selection, verdict words | Variation history and undo/redo |
| Engine | Analyze/cancel game; inspect selected evidence | Analyze current position; cancel stale work on every change |
| Interpretation | Inspect any played move or PV ply using checked facts | Inspect current-position candidates and their evidence |

At tablet width the rail moves below a comfortably sized board. On phones,
the board uses the available width; transport remains next to it, with
Moves / Engine / Explain switching the lower panel. Selecting a lower panel
never hides the board or resets analysis. Import is a dialog or drawer
opened on demand. A full-width PGN editor is not permanent page furniture.

Idle, importing, invalid PGN/FEN, engine startup, analyzing, cancelled,
partial result, engine failure, provider unavailable, storage unavailable,
terminal position and verified explanation each need distinct honest states.
No model token/configuration details appear in normal chess workflows;
connection details belong in Settings.

## Scope and risks

Use the existing Next.js/React web foundation. No Tauri migration is needed.
Ship Review and Explore over one reliable engine-interpretability core.
Search and network evidence can expand it; profiles and drills are excluded. The rail can become too dense, so candidate lines and interpretation detail
must expand on demand. On mobile long games need a bounded move scroller
that keeps the selected ply visible. Verify contrast, 200% zoom, keyboard
operation, screen-reader state announcements, reduced motion and touch
targets in actual renders before accepting the implementation.

Success: a player can open a game or position, see a large readable board,
navigate or try a move, and inspect trustworthy engine evidence and a brief
checked explanation without navigating a dashboard or scrolling past a pitch.
