# Optional local AI

The workspace works without AI. Analyze, inspect checked facts, compare moves
and export traces first. AI selects and orders those facts; it cannot add free
prose or claim to read network internals. No automatic requests or downloads.

On the development Mac, llama.cpp and a cached Qwen3-VL-8B-Instruct Q4_K_M GGUF
were already installed. Text use needs no vision projector. Start your own
server (replace the path with your model):

```sh
llama-server --model /absolute/path/model.gguf --alias stockfih-local \
  --host 127.0.0.1 --port 1234 --ctx-size 4096 --parallel 1 --no-webui
```

Open **AI connection — BYOK or local**. Base URL:
`http://127.0.0.1:1234/v1`; model: `stockfih-local`; leave key empty.
Select a move, optionally Compare selected move, then Explain selected move.
The request contains only that move's checked evidence. Output is capped at
120 tokens and 30 seconds; invalid JSON/references fail visibly with retry.
Connection settings and keys disappear on reload.

The actual browser-to-loopback flow passed on Chromium/macOS, including
rendering checked output, in the opt-in acceptance test:

```sh
npm run build
STOCKFIH_LOCAL_URL=http://127.0.0.1:1234/v1 \
STOCKFIH_LOCAL_MODEL=stockfih-local npm run test:browser
```

The server must permit the page's origin via CORS. HTTPS previews may require
browser local-network permission or reject local HTTP. That varies by browser;
the app reports failure rather than adding a proxy. Use a localhost app if
needed. Ollama's compatible URL is conventionally localhost:11434/v1; other
OpenAI-compatible servers can use their own base URL/model.

Hosted BYOK requires HTTPS and browser CORS support. The key goes only to the
chosen endpoint in Authorization, never storage, exports or the app server.
Redirects and browser credentials are disabled. Hosted live calls were waived
by the owner; mock browser and unit tests verify transport/checking behavior.
