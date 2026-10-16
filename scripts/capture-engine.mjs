import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { Chess } from "chess.js";

const afterE4 = new Chess(); afterE4.move("e4");
const positions = {
  afterE4: afterE4.fen(),
  start: new Chess().fen(),
  beforeMate: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
  matedBlack: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
  matedWhite: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
  stalemate: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
  promotion: "7k/P7/6K1/8/8/8/8/8 w - - 0 1",
  enPassant: "rnbqkbnr/1pp1pppp/p7/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3",
  counterfactual: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3",
  castling: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
};
const engine = spawn(process.execPath, ["public/stockfish/stockfish-18-lite-single.js"]);
let buffer = ""; let waiter;
const lines = [];
engine.stdout.on("data", chunk => {
  buffer += chunk;
  while (buffer.includes("\n")) {
    const end = buffer.indexOf("\n"); const line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1);
    lines.push(line);
    if (waiter?.match(line)) { clearTimeout(waiter.timer); waiter.resolve(); waiter = null; }
  }
});
const send = (command, match) => new Promise((resolve, reject) => {
  waiter = { match, resolve, timer: setTimeout(() => reject(new Error("Capture deadline exceeded")), 15_000) };
  engine.stdin.write(`${command}\n`);
});
try {
  await send("uci", line => line === "uciok");
  await send("setoption name UCI_ShowWDL value true\nisready", line => line === "readyok");
  const output = { package: "stockfish@18.0.7", depth: 8, multipv: 3, showWdl: true, handshake: [...lines], positions: {} };
  for (const [name, fen] of Object.entries(positions)) {
    new Chess(fen);
    const offset = lines.length;
    await send(`ucinewgame\nsetoption name MultiPV value 3\nposition fen ${fen}\ngo depth 8`, line => line.startsWith("bestmove"));
    output.positions[name] = { fen, lines: lines.slice(offset) };
  }
  const fen = positions.counterfactual;
  const offset = lines.length;
  await send(`ucinewgame\nsetoption name MultiPV value 3\nposition fen ${fen}\ngo depth 8 searchmoves g8f6`, line => line.startsWith("bestmove"));
  output.restricted = { fen, rootMove: "g8f6", lines: lines.slice(offset) };
  mkdirSync("tests/fixtures/uci", { recursive: true });
  writeFileSync("tests/fixtures/uci/stockfish-18.json", `${JSON.stringify(output, null, 2)}\n`);
} finally { engine.kill(); }
