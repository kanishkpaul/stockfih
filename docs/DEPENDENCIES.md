# Dependency baseline

Next.js and eslint-config-next are pinned together at 16.4.2, React and
React DOM at 19.3.1, and the shipped engine at stockfish 18.0.7. The lockfile
pins transitive versions. Runtime dependency audit has no high or critical
findings at this baseline; CI checks it again on every run.

The full audit still reports a high advisory in `braces` through the
Next ESLint plugin's fast-glob/micromatch chain. The published latest braces
is 3.0.3, which remains in the affected range. These packages run on the
repository's build/lint inputs, not user PGNs or model replies. No application
route executes them. Track GHSA-vfj7-8cjw-p6xm and update when upstream ships
a compatible fix. Do not force npm's suggested Next lint downgrade to 14.x.
ESLint stays on the 9.x line supported by the config's plugin peer ranges;
upgrading to 10 currently causes incompatible peer resolution.

Engine installation verifies SHA-256 of required JS/WASM before writing
assets, uses stable 0644 modes, normalizes license line endings and fails on
missing/mismatched packages. The unused asm.js build is removed. System
fonts remove build-time Google access. The engine's GPL source/provenance
requirements remain separate from the application's MIT license.
