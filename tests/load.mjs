import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();
export function load(path) {
  if (path.endsWith(".json")) return JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
  if (cache.has(path)) return cache.get(path).exports;
  const loaded = { exports: {} };
  cache.set(path, loaded);
  const compiled = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "module", "exports", compiled)(
    name => name.startsWith("@/") ? load(name.endsWith(".json") ? name.slice(2) : `${name.slice(2)}.ts`) : require(name), loaded, loaded.exports,
  );
  return loaded.exports;
}
