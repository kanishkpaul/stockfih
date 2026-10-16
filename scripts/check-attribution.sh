#!/bin/sh
# Fails if commit or pull request text credits an AI tool (AGENTS.md, rule 1).
# The commit-msg hook and CI both call this, so the pattern lives only here.
#
# Usage: check-attribution.sh FILE, or pipe the text on stdin.

pattern='^[[:space:]]*co-authored-by:.*(claude|anthropic|openai|chatgpt|gpt-[0-9]|codex|copilot|gemini|cursor|devin|aider)'
pattern="$pattern"'|generated (with|by) .*(claude|chatgpt|codex|copilot|gemini|cursor|an? ai)'
pattern="$pattern"'|🤖'

if grep -inE "$pattern" "${1:--}"; then
  echo "AI attribution found. Remove it; see rule 1 in AGENTS.md." >&2
  exit 1
fi
