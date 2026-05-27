import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const sourceDir = join(root, "node_modules", "stockfish", "bin");
const targetDir = join(root, "public", "stockfish");

if (!existsSync(sourceDir)) {
  console.warn("[stockfih] Stockfish assets were not found. Skipping copy.");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const asset of [
  "stockfish-18-lite-single.js",
  "stockfish-18-lite-single.wasm",
  "stockfish-18-asm.js",
]) {
  cpSync(join(sourceDir, asset), join(targetDir, asset), { force: true });
}

cpSync(
  join(root, "node_modules", "stockfish", "Copying.txt"),
  join(targetDir, "Copying.txt"),
  { force: true },
);
