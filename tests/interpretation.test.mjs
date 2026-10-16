import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { Chess } from "chess.js";
import ts from "typescript";

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL("../src/core/interpretation.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", compiled)(require, loaded, loaded.exports);
const { checkedExplanation, completionUrl, explainMove, movesToInspect } = loaded.exports;
const fixture = JSON.parse(readFileSync(new URL("../docs/audit/stockfish-18.json", import.meta.url), "utf8"));
const root = fixture.positions.start;
const deepest = root.lines.filter(line => line.includes("info depth 4 "));
const position = {
  fen: root.fen, depth: 4, evaluation: { type: "cp", value: 33 },
  lines: deepest.map(line => ({
    multipv: Number(line.match(/multipv (\d+)/)[1]), depth: 4,
    score: { type: "cp", value: Number(line.match(/score cp (-?\d+)/)[1]) },
    pv: line.split(" pv ")[1].split(" "),
  })),
};
const target = movesToInspect(position, null)[0];
const connection = { baseUrl: "http://localhost:11434/v1", model: "local-model", apiKey: "" };
const answer = content => new Response(JSON.stringify({ choices: [{ message: { content } }] }));

test("every ply of every captured candidate has its own legal position", () => {
  const moves = movesToInspect(position, null);
  assert.equal(moves.length, position.lines.reduce((sum, line) => sum + line.pv.length, 0));
  for (const move of moves) {
    const board = new Chess(move.fen);
    assert.doesNotThrow(() => board.move({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4), promotion: move.uci[4] }));
    assert.ok(move.facts.some(fact => fact.includes("not a separate evaluation")));
  }
  assert.equal(new Chess(moves[1].fen).turn(), "b");
});

test("game moves remain inspectable when Stockfish has not analyzed them", () => {
  const board = new Chess();
  const move = board.move("e4");
  const played = { ...move, beforeFen: move.before, afterFen: move.after, moveNumber: 1 };
  const moves = movesToInspect(null, played);
  assert.equal(moves.length, 1);
  assert.match(moves[0].facts[0], /White plays e4/);
  assert.equal(moves[0].facts.length, 1);
});

test("analysis from another game cannot become explanation evidence", () => {
  const board = new Chess();
  const move = board.move("e4");
  assert.throws(() => movesToInspect(position, { ...move, beforeFen: move.before, afterFen: move.after }), /different position/);
});

test("en passant facts are computed by chess rules", () => {
  const board = new Chess();
  for (const san of ["e4", "a6", "e5", "d5"]) board.move(san);
  const move = board.move("exd6");
  const facts = movesToInspect(null, { ...move, beforeFen: move.before, afterFen: move.after })[0].facts;
  assert.ok(facts.includes("This captures a pawn."));
  assert.ok(facts.includes("The capture is en passant."));
});

test("model references can only reorder existing facts", () => {
  assert.equal(checkedExplanation('{"facts":[1,0]}', ["move", "score"]), "score\n\nmove");
  for (const content of ['{"facts":[2,0]}', '{"facts":[0,0]}', '{"facts":[1]}', '{"facts":[0],"text":"Qh9#"}', '{"facts":["0"]}', 'Qh9#']) {
    assert.throws(() => checkedExplanation(content, ["move", "score"]));
  }
});

test("only secure hosted URLs or loopback HTTP are allowed", () => {
  assert.equal(completionUrl("http://localhost:1234/v1/"), "http://localhost:1234/v1/chat/completions");
  assert.equal(completionUrl("https://provider.example/v1"), "https://provider.example/v1/chat/completions");
  for (const url of ["http://provider.example/v1", "https://key@provider.example/v1", "https://provider.example/v1?key=secret", "file:///tmp/model"]) {
    assert.throws(() => completionUrl(url));
  }
});

test("BYOK goes only to the selected endpoint and is absent from the prompt", async () => {
  const text = await explainMove(target, { ...connection, baseUrl: "https://provider.example/v1", apiKey: "test-key" }, new AbortController().signal,
    async (url, options) => {
      assert.equal(url, "https://provider.example/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer test-key");
      assert.equal(options.redirect, "error");
      assert.equal(options.credentials, "omit");
      assert.ok(!options.body.includes("test-key"));
      assert.equal(JSON.parse(options.body).max_tokens, 120);
      return answer('{"facts":[0]}');
    });
  assert.equal(text, target.facts[0]);
});

test("local models do not require a key or provider-specific JSON mode", async () => {
  await explainMove(target, connection, new AbortController().signal, async (url, options) => {
    assert.equal(url, "http://localhost:11434/v1/chat/completions");
    assert.ok(!("Authorization" in options.headers));
    assert.ok(!("response_format" in JSON.parse(options.body)));
    return answer('{"facts":[0]}');
  });
});

test("provider failure is an error, never a cached fallback", async () => {
  await assert.rejects(explainMove(target, connection, new AbortController().signal,
    async () => new Response("failure", { status: 429 })), /429/);
  await assert.rejects(explainMove(target, connection, new AbortController().signal,
    async () => answer('{"facts":[999]}')), /evidence|omitted/);
});

test("cancellation reaches the model request", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(explainMove(target, connection, controller.signal, async (url, options) => {
    assert.equal(options.signal.aborted, true);
    options.signal.throwIfAborted();
  }), { name: "AbortError" });
});
