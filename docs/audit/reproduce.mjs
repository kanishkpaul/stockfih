// Audit probes reproduce current defects; they are not acceptance tests for fixes.
// Engine lines are captured from the installed Stockfish build, never invented.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const require = createRequire(import.meta.url);
const timers = new Map();
let timerId = 0;
const scope = {
  window: {
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  },
  fetch: async () => { throw new Error('Offline audit probe'); },
};
const modules = new Map();

function load(relative) {
  const file = path.join(root, relative);
  if (modules.has(file)) return modules.get(file).exports;
  const loaded = { exports: {} };
  modules.set(file, loaded);
  const source = execFileSync('git', ['show', `1e817f925d25acff43d6d7d3edbda3bbcf0ae570:${relative}`], { cwd: root, encoding: 'utf8' });
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const resolve = (name) => name.startsWith('@/')
    ? load(`${name.slice(2)}.ts`)
    : require(require.resolve(name, { paths: [root] }));
  new Function('require', 'module', 'exports', 'window', 'fetch', 'process', compiled)(
    resolve, loaded, loaded.exports, scope.window, scope.fetch, { env: {} },
  );
  return loaded.exports;
}

async function capture() {
  const engine = spawn(process.execPath, ['public/stockfish/stockfish-18-lite-single.js'], {
    cwd: root, stdio: ['pipe', 'pipe', 'pipe'],
  });
  let buffer = '';
  let waiting = null;
  const lines = [];
  engine.stderr.on('data', () => {});
  engine.stdout.on('data', chunk => {
    buffer += chunk.toString();
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n');
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      lines.push(line);
      if (waiting?.match(line)) {
        clearTimeout(waiting.timer);
        waiting.resolve();
        waiting = null;
      }
    }
  });
  const send = (commands, match) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Engine capture timed out')), 15000);
    waiting = { match, resolve, timer };
    engine.stdin.write(`${commands}\n`);
  });
  const chess = load('lib/chess.ts');
  const sample = chess.parsePgn(chess.SAMPLE_PGN);
  const positions = {
    start: chess.DEFAULT_FEN,
    mated: sample.moves.at(-1).afterFen,
    stalemate: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
  };
  const output = {};
  try {
    await send('uci', line => line === 'uciok');
    await send('isready', line => line === 'readyok');
    const handshake = [...lines];
    for (const [name, fen] of Object.entries(positions)) {
      const offset = lines.length;
      await send(`setoption name MultiPV value 3\nposition fen ${fen}\ngo depth 4`,
        line => line.startsWith('bestmove'));
      output[name] = { fen, lines: lines.slice(offset) };
    }
    const fixture = { package: 'stockfish@18.0.7', depth: 4, handshake, positions: output };
    writeFileSync(path.join(directory, 'stockfish-18.json'), `${JSON.stringify(fixture, null, 2)}\n`);
    return output;
  } finally {
    engine.kill();
  }
}

async function main() {
  const fixtures = await capture();
  const chess = load('lib/chess.ts');
  const classify = load('lib/classify.ts');
  const prompts = load('lib/prompts.ts');
  const { Chess } = require('chess.js');
  const observed = [];
  const note = (id, detail) => observed.push({ id, detail });
  const game = chess.parsePgn('1. e4 e5 2. Nf3 Nc6');
  const other = chess.parsePgn('1. d4 d5 2. Nf3 Nf6');
  assert.equal(game.moves[2].id, other.moves[2].id);
  assert.notEqual(game.moves[2].beforeFen, other.moves[2].beforeFen);
  note('B01', `Different positions share cache identity ${game.moves[2].id}:default`);
  const loss = classify.classifyMove(game.moves[0], null,
    { type: 'mate', value: 3 }, { type: 'mate', value: 5 });
  assert.equal(loss.classification, 'Blunder');
  note('B07', loss);
  assert.equal(classify.formatSwing(classify.scoreToComparable({ type: 'mate', value: -1 }) * -1), '990.00 pawns');
  note('B08', 'Allows mate is represented as a 990-pawn score');
  assert.equal(classify.classifyMove(game.moves[0], null,
    { type: 'cp', value: 1000 }, { type: 'cp', value: 700 }).classification, 'Blunder');
  note('B09', '+10 to +7 is a Blunder under fixed thresholds');
  assert.equal(classify.classifyMove(game.moves[0], null, null, null).classification, 'Good');
  note('B10', 'No engine scores and no best move still returns Good');
  const setupFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 23';
  const setup = chess.parsePgn(`[SetUp "1"]\n[FEN "${setupFen}"]\n\n23... e5 24. e4 *`);
  assert.equal(setup.moves[0].color, 'b');
  assert.equal(setup.moves[0].moveNumber, 1);
  note('B11', '23...e5 is recorded as move 1; MoveList places it in the white column');
  const ep = chess.parsePgn('1. e4 a6 2. e5 d5 3. exd6');
  assert.equal(ep.moves.at(-1).isCapture, false);
  note('B12', 'En passant exd6 has isCapture=false');
  const payload = {
    fen: game.initialFen, playedMove: 'e4', bestMove: null,
    evalBefore: null, evalAfter: null, classification: 'Good', pgnContext: '', tone: 'default',
  };
  assert.match(prompts.buildFallbackExplanation(payload), /already matches/);
  note('B18', 'Missing best move produces a false claim that the played move matches it');
  const route = load('app/api/explain/route.ts');
  const invalid = await route.POST({ json: async () => ({
    fen: 'invalid', playedMove: 'invalid', classification: 'invented',
    pgnContext: '', tone: 'unsupported',
  }) });
  assert.equal(invalid.status, 200);
  note('B13', 'Invalid FEN, move, classification, tone and missing scores return HTTP 200');
  const oversized = await route.POST({ json: async () => ({ ...payload, pgnContext: 'x'.repeat(2 ** 20) }) });
  assert.equal(oversized.status, 200);
  note('B14', 'The handler accepts a 1 MiB context without an application limit');
  const client = load('lib/stockfish.ts').getStockfishClient();
  for (const name of ['mated', 'stalemate']) {
    const pending = { fen: fixtures[name].fen, depth: 4, lines: new Map() };
    for (const line of fixtures[name].lines) {
      if (line.startsWith('info ')) client.consumeInfoLine(line, pending);
    }
    assert.equal(pending.lines.size, 0);
    note('B06', `${name}: engine score discarded because terminal output has no PV`);
  }
  const init1 = await client.ensureReady().catch(error => error.message);
  const init2 = await client.ensureReady().catch(error => error.message);
  assert.equal(init1, init2);
  assert.notEqual(client.initPromise, null);
  note('B05', 'Failed initialization is retained as the rejected initPromise');
  client.initPromise = Promise.resolve();
  client.syncReady = async () => {};
  const sent = [];
  client.worker = { postMessage: command => sent.push(command) };
  const first = client.analyzePosition(game.initialFen, 4).catch(error => error.message);
  await new Promise(resolve => setImmediate(resolve));
  timers.get(client.pending.timer)();
  assert.equal(await first, 'Stockfish analysis timed out.');
  assert.equal(sent.includes('stop'), false);
  const second = client.analyzePosition(game.moves[0].afterFen, 4);
  await new Promise(resolve => setImmediate(resolve));
  for (const line of fixtures.start.lines) client.consumeLine(line);
  const stale = await second;
  assert.equal(stale.fen, game.moves[0].afterFen);
  assert.equal(stale.bestMoveSan, null);
  note('B04', 'A timed-out white search completes the next black search with an illegal best move');
  for (const { fen } of Object.values(fixtures)) assert.doesNotThrow(() => new Chess(fen));
  writeFileSync(path.join(directory, 'reproductions.json'), `${JSON.stringify(observed, null, 2)}\n`);
  console.log(JSON.stringify(observed, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
