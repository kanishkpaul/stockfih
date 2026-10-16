# Corresponding engine source

Distributed binaries: unmodified stockfish npm package 18.0.7,
lite single-threaded Stockfish 18 WASM. Binary hashes are in manifest.json.
GPLv3 license: Copying.txt. Engine copyright: Stockfish developers and
Stockfish.js contributors, including Chess.com, LLC; see archive AUTHORS.

Source revision: https://github.com/nmrugg/stockfish.js/tree/32d4b5ae40c01db88219bfbe2b82dbe6dec93832
The adjacent stockfish-18.0.7-source.tar.gz contains that revision, including
build scripts and notices, plus the lite net required by src/lite_nets.h:

nn-9067e33176e8.nnue
SHA256 9067e33176e8c5edb7aa8db6a3aedd012f84a1f39872e86357c6c2d0993f314d
Retrieved from https://tests.stockfishchess.org/api/nn/nn-9067e33176e8.nnue

Upstream build prerequisites: Node.js, make, Python and Emscripten 3.1.7
(emsdk install 3.1.7; emsdk activate 3.1.7; source emsdk_env.sh).
Extract the archive; from its root run:

node build.js --single-threaded --lite --no-split -f

See build.js --help and upstream README.md. This project ships npm's
unmodified binaries rather than a local rebuild. The source/build inputs
are provided; byte-identical compiler reproduction has not been tested.
