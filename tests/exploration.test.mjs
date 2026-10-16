import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { explore, play } = load("src/core/exploration.ts");
const { DEFAULT_FEN } = load("lib/chess.ts");

test("branching truncates redo while preserving the original variation", () => {
  const original = play(play(explore(DEFAULT_FEN), "e2e4"), "e7e5");
  const branch = play({ ...original, cursor: 1 }, "c7c5");
  assert.equal(original.moves[1].san, "e5");
  assert.equal(branch.moves[1].san, "c5");
  assert.equal(branch.fens.length, 3);
  assert.equal(branch.cursor, 2);
});

test("exploration rejects malformed FEN and illegal moves without mutating history", () => {
  assert.throws(() => explore("invalid"));
  const start = explore(DEFAULT_FEN);
  assert.throws(() => play(start, "e2e5"));
  assert.equal(start.moves.length, 0);
});

test("all four explicit underpromotion choices are legal variation moves", () => {
  for (const piece of ["q", "r", "b", "n"]) {
    const branch = play(explore("7k/P7/6K1/8/8/8/8/8 w - - 0 1"), `a7a8${piece}`);
    assert.equal(branch.moves[0].promotion, piece);
  }
});
