import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { engine, installEngine } from "../scripts/copy-stockfish.mjs";

test("installation verifies the pinned build and produces stable bytes and modes", () => {
  const target = mkdtempSync(join(tmpdir(), "stockfih-assets-"));
  try {
    installEngine(resolve("node_modules/stockfish"), target);
    const before = readFileSync(join(target, "manifest.json"));
    installEngine(resolve("node_modules/stockfish"), target);
    assert.deepEqual(readFileSync(join(target, "manifest.json")), before);
    for (const name of Object.keys(engine.assets)) assert.equal(statSync(join(target, name)).mode & 0o777, 0o644);
  } finally { rmSync(target, { recursive: true }); }
});

test("missing engine packages fail installation instead of silently skipping", () => {
  assert.throws(() => installEngine("/nonexistent-stockfih-package", "/nonexistent-stockfih-output"));
});
