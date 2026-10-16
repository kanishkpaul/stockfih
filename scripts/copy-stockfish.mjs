import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const engine = {
  package: "stockfish", version: "18.0.7",
  assets: {
    "stockfish-18-lite-single.js": "2278005057f381491f1c9bb3e44c9f5920b3a00bef9759e33cc6582769a1f1fe",
    "stockfish-18-lite-single.wasm": "a8fbc05ec6920b56d7485826dcb02c5ffd2826bcbf751cf973046f237a9096f1",
  },
};

export function installEngine(packageDir, targetDir) {
  const installed = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  if (installed.version !== engine.version) throw new Error("Stockfish version does not match the pinned build.");
  const assets = Object.entries(engine.assets).map(([name, expected]) => {
    const bytes = readFileSync(join(packageDir, "bin", name));
    if (createHash("sha256").update(bytes).digest("hex") !== expected) {
      throw new Error(`Stockfish checksum mismatch: ${name}`);
    }
    return [name, bytes];
  });
  const license = readFileSync(join(packageDir, "Copying.txt"), "utf8").replace(/\r\n/g, "\n");
  mkdirSync(targetDir, { recursive: true });
  for (const [name, bytes] of [...assets, ["Copying.txt", license], ["manifest.json", `${JSON.stringify(engine, null, 2)}\n`]]) {
    const target = join(targetDir, name);
    writeFileSync(target, bytes);
    chmodSync(target, 0o644);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  installEngine(join(root, "node_modules/stockfish"), join(root, "public/stockfish"));
}
