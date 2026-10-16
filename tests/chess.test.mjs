import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { load } from "./load.mjs";

const { parseInfo, positionResult } = load("src/core/uci.ts");
const { parsePgn } = load("lib/chess.ts");
const { classifyMove, formatEval, formatEvalLong } = load("lib/classify.ts");
const fixture = JSON.parse(readFileSync(new URL("fixtures/uci/stockfish-18.json", import.meta.url)));
const move = parsePgn("1. e4 *").moves[0];

function result(name) {
  const captured = fixture.positions[name];
  const lines = new Map();
  for (const raw of captured.lines) {
    const parsed = parseInfo(raw, captured.fen);
    if (parsed) lines.set(parsed.multipv, parsed);
  }
  return positionResult(captured.fen, [...lines.values()], null);
}

test("both terminal mate winners survive real output without a principal variation", () => {
  for (const [name, winner] of [["matedBlack", "w"], ["matedWhite", "b"]]) {
    const analysis = result(name);
    assert.equal(analysis.terminal.kind, "mate");
    assert.equal(analysis.evaluation.winner, winner);
    assert.equal(analysis.depth, 0);
    assert.equal(formatEval(analysis.evaluation), winner === "w" ? "1–0" : "0–1");
    assert.match(formatEvalLong(analysis.evaluation), /delivered checkmate/);
  }
});

test("stalemate has an equal score and a fully drawn WDL", () => {
  const analysis = result("stalemate");
  assert.equal(analysis.terminal.reason, "stalemate");
  assert.deepEqual(analysis.wdl, { win: 0, draw: 1000, loss: 0 });
  assert.equal(analysis.evaluation.value, 0);
});

test("WDL from a black-to-move capture is stored from White's perspective", () => {
  const captured = fixture.positions.afterE4;
  const raw = captured.lines.find(line => / wdl /.test(line));
  const black = parseInfo(raw, captured.fen);
  const [win, draw, loss] = raw.match(/ wdl (\d+) (\d+) (\d+)/).slice(1).map(Number);
  assert.deepEqual(black.wdl, { win: loss, draw, loss: win });
  assert.equal(black.score.value, -Number(raw.match(/ score cp (-?\d+)/)[1]));
});

test("preserving a forced mate does not become a centipawn blunder", () => {
  const verdict = classifyMove(move, { type: "mate", value: 3 }, { type: "mate", value: 5 });
  assert.equal(verdict.classification, "Best");
  assert.equal(verdict.expectedLoss, 0);
  assert.equal(verdict.lossCp, null);
});

test("allowing mate is explicit and never shown as hundreds of pawns", () => {
  const verdict = classifyMove(move, { type: "cp", value: 0 }, { type: "mate", value: -1 }, { win: 0, draw: 1000, loss: 0 });
  assert.equal(verdict.classification, "Allows mate");
  assert.equal(verdict.lossCp, null);
});

test("a drop from +10 to +7 uses outcome loss rather than a fixed cp threshold", () => {
  const verdict = classifyMove(move, { type: "cp", value: 1000 }, { type: "cp", value: 700 },
    { win: 1000, draw: 0, loss: 0 }, { win: 1000, draw: 0, loss: 0 });
  assert.equal(verdict.classification, "Best");
  assert.equal(verdict.expectedLoss, 0);
});

test("missing WDL and score never produce a confident verdict", () => {
  assert.equal(classifyMove(move, null, null).classification, "Unavailable");
  assert.equal(classifyMove(move, { type: "cp", value: 0 }, { type: "cp", value: 10 }).classification, "Unavailable");
});

test("setup PGNs preserve Black's move number and en passant is a capture", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 23";
  const setup = parsePgn(`[SetUp "1"]\n[FEN "${fen}"]\n\n23... e5 24. e4 *`);
  assert.equal(setup.moves[0].moveNumber, 23);
  assert.equal(setup.moves[0].color, "b");
  assert.equal(setup.moves[1].moveNumber, 24);
  assert.equal(parsePgn("1. e4 a6 2. e5 d5 3. exd6 *").moves.at(-1).isCapture, true);
});

test("both castlings and every promotion piece parse through the chess boundary", () => {
  const castle = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
  for (const san of ["O-O", "O-O-O"]) {
    assert.equal(parsePgn(`[SetUp "1"]\n[FEN "${castle}"]\n\n1. ${san} *`).moves[0].isCastle, true);
  }
  for (const piece of ["Q", "R", "B", "N"]) {
    const promotion = "7k/P7/6K1/8/8/8/8/8 w - - 0 1";
    const game = parsePgn(`[SetUp "1"]\n[FEN "${promotion}"]\n\n1. a8=${piece} *`);
    assert.equal(game.moves[0].promotion, piece.toLowerCase());
  }
});

test("expected-score bands cover every published label", () => {
  for (const [win, expected] of [[499, "Best"], [480, "Excellent"], [450, "Good"], [400, "Inaccuracy"], [350, "Mistake"], [100, "Blunder"]]) {
    const verdict = classifyMove(move, { type: "cp", value: 0 }, { type: "cp", value: -100 },
      { win: 500, draw: 0, loss: 500 }, { win, draw: 0, loss: 1000 - win });
    assert.equal(verdict.classification, expected);
  }
});
