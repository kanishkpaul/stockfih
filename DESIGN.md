---
name: Stockfih
description: A quiet, board-first workspace for inspecting chess engine evidence.
colors:
  page: "#171715"
  surface: "#22221f"
  surface-raised: "#2d2d29"
  text: "#edede8"
  muted: "#b4b4a9"
  border: "#44443d"
  accent: "#a9c78c"
  accent-ink: "#182110"
  error: "#ffb5a5"
  board-light: "#e8d6b1"
  board-dark: "#a58261"
  arrow: "#49783e"
  selection: "#c4c275"
typography:
  title: {fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: "24px", fontWeight: 650, lineHeight: 1.1}
  heading: {fontSize: "16px", fontWeight: 600}
  body: {fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: "14px", lineHeight: 1.55}
  notation: {fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: "12px", lineHeight: 1.6}
  evaluation: {fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: "20px", lineHeight: 1.3}
rounded:
  control: "4px"
spacing:
  space-1: ".25rem"
  space-2: ".5rem"
  space-3: ".75rem"
  space-4: "1rem"
  space-6: "1.5rem"
components:
  button-primary: {backgroundColor: "{colors.accent}", textColor: "{colors.accent-ink}", rounded: "{rounded.control}", padding: ".55rem .8rem"}
  button-secondary: {backgroundColor: "{colors.surface-raised}", textColor: "{colors.text}", rounded: "{rounded.control}"}
  button-ghost: {backgroundColor: "transparent", textColor: "{colors.muted}", rounded: "{rounded.control}"}
  input: {backgroundColor: "{colors.page}", textColor: "{colors.text}", rounded: "{rounded.control}", padding: ".55rem .7rem"}
  analysis-rail: {backgroundColor: "{colors.surface}", padding: "{spacing.space-4}"}
---

# Design System: Stockfih

## Overview

**Creative North Star: "Inside the search."**

A quiet chess workspace: the board carries the visual weight, with compact engine evidence beside it. Warm dark neutrals, traditional board colors and restrained green actions support inspection without decorative chrome. Review and Explore have equal standing; AI remains an optional layer over checked evidence.

**Key Characteristics:**
- Large square board, compact controls and readable notation.
- Flat surfaces, fine borders and disclosure on demand.
- Explicit selection, progress, errors and cancellation.

## Colors

### Primary
Muted leaf green (`accent`) marks primary actions, links, focus and selected navigation; dark green ink keeps action labels legible. The board's forest-green arrow and olive selection identify the inspected move and selected square.

### Neutral
Warm charcoal steps from page to rail to raised controls. Ivory text, stone secondary text and fine gray borders organize dense evidence. Cream and brown squares keep the chessboard familiar. Soft coral is reserved for errors and loss labels, with accompanying words.

**The Board Leads Rule.** Keep the neutral shell quiet enough that pieces, position and inspected moves remain the first read.

## Typography

System sans serves the interface; system monospace serves notation, FEN and evaluation. Fonts require no remote fetch. The modest title and section headings organize a working tool rather than a marketing page. Supporting labels use smaller text (12–13px); move tables use monospace (13px) with smaller headers (11px). Transport counts use tabular numerals.

## Layout

The centered workspace caps at (1240px), with outer padding from `space-6`. Desktop pairs a flexible board column with a (400px) rail and a `space-6` gap. The square board is additionally limited by viewport height. Transport stays directly below it; import and move/FEN tools use disclosures.

At widths up to (850px), outer padding becomes `space-3`, the layout stacks, and the board caps at (680px). Engine / Moves / Explain tabs switch the lower panel without hiding the board. The engine identity leaves the compact header. Import forms stack; actions wrap. Game moves scroll within a bounded area (230px).

## Elevation & Depth

Flat tonal layers and thin borders convey grouping. There are no ambient shadows, glass or gradients. The current move uses an inset accent outline; keyboard focus uses an external accent outline (2px, offset 3px). Board moves have no animation; reduced-motion preferences suppress animation and transitions.

## Shapes

Controls have small, consistent corners from `rounded.control`. The board and analysis rail remain square-edged. Borders divide sections rather than creating nested cards. Preserve the board's square geometry at every width.

## Components

- **Buttons:** primary green, raised secondary and transparent ghost variants share compact padding and a minimum height (38px). Hover brightens enabled buttons; disabled controls dim (45%). The current size prop has no separate visual sizes.
- **Fields:** dark page fill, fine border and small corners. PGN/FEN editors use monospace; API keys use password inputs. The file chooser carries its focus outline on the visible label.
- **Navigation:** Review / Explore use a raised selected background and green text. Mobile panel tabs add a green underline and support arrow keys, Home and End.
- **Analysis rail:** one flat surface groups search, moves and inspection. Desktop sections use separators; mobile shows the selected panel. Status, cancellation and partial-result text stay explicit.
- **Move rows:** compact aligned notation; the current ply has a raised fill and inset accent outline. Loss labels add words alongside color.
- **Board and inspector:** local piece rendering, tan/brown squares, one inspected-move arrow, before/result toggle and visible position context. Checked facts lead; connection configuration remains in a disclosure.

## Do's and Don'ts

### Do:
- **Do** keep the board and inspected evidence prominent.
- **Do** reuse project-owned tokens, compact controls and locally shipped assets.
- **Do** preserve visible keyboard focus and honest request states.

### Don't:
- **Don't** add shared design-kit imports, skins or tokens.
- **Don't** add glow, glass, gradients, marketing heroes or celebratory decoration.
- **Don't** turn interpretation into tutoring, coaching, quizzes, drills or learner profiles.
- **Don't** present unchecked model prose as engine evidence.
