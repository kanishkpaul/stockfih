import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { load } from "./load.mjs";

const { StockfishClient } = load("src/core/engine.ts");
const fixture = JSON.parse(readFileSync(new URL("../docs/audit/stockfish-18.json", import.meta.url)));
const ack = word => fixture.handshake.find(line => line === word);
const flush = () => new Promise(resolve => setImmediate(resolve));

class WorkerFixture {
  listeners = new Map(); commands = []; terminated = false; responds = true;
  addEventListener(kind, callback) { this.listeners.set(kind, callback); }
  terminate() { this.terminated = true; }
  emit(line) { this.listeners.get("message")({ data: line }); }
  postMessage(command) {
    this.commands.push(command);
    if (this.responds && ["uci", "isready"].includes(command)) {
      queueMicrotask(() => this.emit(ack(command === "uci" ? "uciok" : "readyok")));
    }
  }
  finish() { fixture.positions.start.lines.forEach(line => this.emit(line)); }
}

test("concurrent callers are serialized into separate searches", async () => {
  const worker = new WorkerFixture();
  const client = new StockfishClient(() => worker);
  const first = client.analyzePosition(fixture.positions.start.fen, 4);
  const second = client.analyzePosition(fixture.positions.start.fen, 4);
  await flush();
  assert.equal(worker.commands.filter(command => command.startsWith("go ")).length, 1);
  worker.finish(); await first; await flush();
  assert.equal(worker.commands.filter(command => command.startsWith("go ")).length, 2);
  worker.finish(); await second; client.dispose();
});

test("cancel retires the worker and its late output cannot complete the next job", async () => {
  const workers = [];
  const client = new StockfishClient(() => { const worker = new WorkerFixture(); workers.push(worker); return worker; });
  const controller = new AbortController();
  const first = client.analyzePosition(fixture.positions.start.fen, 4, controller.signal);
  const rejected = assert.rejects(first, { name: "AbortError" });
  await flush(); controller.abort(); await rejected;
  assert.equal(workers[0].terminated, true);
  let completed = false;
  const second = client.analyzePosition(fixture.positions.start.fen, 4).then(analysis => { completed = true; return analysis; });
  await flush(); workers[0].finish(); await flush();
  assert.equal(completed, false);
  workers[1].finish(); await second; client.dispose();
});

test("startup construction failure can be retried", async () => {
  const worker = new WorkerFixture(); let attempts = 0;
  const client = new StockfishClient(() => { if (++attempts === 1) throw new Error("Missing asset"); return worker; });
  await assert.rejects(client.newGame(), /Missing asset/);
  await client.newGame(); assert.equal(attempts, 2); client.dispose();
});

test("readiness deadline settles a hung startup and allows recovery", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const worker = new WorkerFixture(); worker.responds = false;
  const client = new StockfishClient(() => worker);
  const first = assert.rejects(client.newGame(), /timed out/);
  await flush(); t.mock.timers.tick(15_000); await first;
  worker.responds = true; await client.newGame(); client.dispose();
});

test("a runtime crash rejects the active search instead of waiting for its timeout", async () => {
  const worker = new WorkerFixture(); const client = new StockfishClient(() => worker);
  const failed = assert.rejects(client.analyzePosition(fixture.positions.start.fen, 4), /worker failed/);
  await flush(); worker.listeners.get("error")({}); await failed;
  assert.equal(worker.terminated, true); client.dispose();
});

test("search timeout retires the worker and rejects the request", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const worker = new WorkerFixture(); const client = new StockfishClient(() => worker);
  const failed = assert.rejects(client.analyzePosition(fixture.positions.start.fen, 4), /search.*timed out/);
  await flush(); t.mock.timers.tick(60_000); await failed;
  assert.equal(worker.terminated, true); client.dispose();
});
