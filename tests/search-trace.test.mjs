import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { load } from "./load.mjs";
const fixture = JSON.parse(readFileSync(new URL("./fixtures/uci/stockfish-18.json", import.meta.url)));
const { StockfishClient } = load("src/core/engine.ts");
const { comparisonFacts, traceExport } = load("src/core/search-trace.ts");
const { movesToInspect } = load("src/core/interpretation.ts");

function clientFor(capture) {
  const commands = []; let message;
  const client = new StockfishClient(() => ({
    addEventListener(kind, callback) { if (kind === "message") message = callback; }, terminate() {},
    postMessage(command) {
      commands.push(command);
      queueMicrotask(() => {
        const lines = command === "uci" ? [fixture.handshake.find(line => line === "uciok")] : command === "isready" ? [fixture.handshake.find(line => line === "readyok")] : command.startsWith("go ") ? capture.lines : [];
        lines.forEach(line => message({ data: line }));
      });
    },
  }));
  return { client, commands };
}

test("a captured search retains every reported depth with build and option provenance", async () => {
  const { client } = clientFor(fixture.positions.start);
  const position = await client.analyzePosition(fixture.positions.start.fen, 8);
  assert.deepEqual(position.trace.map(frame => frame.depth), [1,2,3,4,5,6,7,8]);
  assert(position.trace.every(frame => frame.nodes > 0 && frame.lines[0].depth === frame.depth));
  assert.equal(position.provenance.engine.version, "18.0.7");
  assert.equal(position.provenance.engine.assets["stockfish-18-lite-single.wasm"].length, 64);
  const exported = JSON.parse(traceExport(position, null));
  assert.equal(exported.position.fen, position.fen);
  assert.equal(exported.position.provenance.threads, 1);
  assert(!JSON.stringify(exported).includes("apiKey")); client.dispose();
});

test("a restricted same-root search exposes the captured checkmate refutation", async () => {
  const { client, commands } = clientFor(fixture.restricted);
  const restricted = await client.analyzePosition(fixture.restricted.fen, 8, undefined, "g8f6");
  assert(commands.includes("go depth 8 searchmoves g8f6"));
  assert.equal(restricted.lines[0].pv[1], "h5f7");
  const open = clientFor(fixture.positions.counterfactual);
  const unrestricted = await open.client.analyzePosition(fixture.restricted.fen, 8);
  const target = movesToInspect(restricted, null)[0];
  const comparison = { fen: target.fen, uci: target.uci, restricted, unrestricted };
  assert(comparisonFacts(comparison, target).join(" ").includes("Qxf7#"));
  assert.deepEqual(comparisonFacts(comparison, { ...target, uci: "g8h6" }), []);
  await assert.rejects(client.analyzePosition(target.fen, 8, undefined, "e2e5"), /illegal/);
  client.dispose(); open.client.dispose();
});
