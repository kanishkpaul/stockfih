# Review and Explore

Review keeps the imported PGN unchanged. Select a game move or an engine
continuation to inspect its before-position; Show result replays exactly
that move. The engine score is labelled as after the game move or as the
analysis root, never an unmeasured evaluation of a mid-PV position.

Explore creates an independent history from the displayed FEN. Drag, click
source/destination, or enter UCI with the keyboard. Promotion is explicit.
Undo/redo moves a history cursor; playing after undo discards only the
variation's redo branch, not the imported game. Selecting Review restores
the game. Load PGN/file/FEN from the collapsed import area.

The interface uses project-owned warm neutrals, muted green actions, a
traditional board and system fonts. There are no design-kit imports. The
responsive board and rail are tested at 360px and at 200% zoom. Every input
has a label; errors/status are announced; the move list marks the selected
ply without scrolling the document away from the board. Reduced motion
turns off transitions, and chessboard animation is disabled.
