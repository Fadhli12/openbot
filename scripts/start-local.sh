#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOGS="$ROOT/.logs"
mkdir -p "$LOGS"

echo "OpenBot Local (No-Docker) Launcher"
echo "=================================="

# Ensure directories for computer workspace and profiles exist
mkdir -p "$HOME/.openbot/workspace" "$HOME/.openbot/profiles"

# Check PostgreSQL
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "Error: Local PostgreSQL is not running on port 5432."
  echo "Please start it via: brew services start postgresql@17"
  exit 1
fi
echo "✓ Local PostgreSQL is running"

# Check OmniRoute local endpoint
if ! curl -s http://127.0.0.1:20128/v1/models >/dev/null 2>&1; then
  echo "Warning: OmniRoute does not seem to be responding on http://127.0.0.1:20128/v1"
else
  echo "✓ Local OmniRoute is reachable on port 20128"
fi

# Run DB migrations
echo "Running database migrations..."
bun run --cwd server db:migrate

# Stop old local processes if running
pkill -f "bun.*agent-computer/src/index.ts" 2>/dev/null || true
pkill -f "bun.*agent-langgraph/src/index.ts" 2>/dev/null || true
pkill -f "bun.*server/src/production-entry.ts" 2>/dev/null || true
pkill -f "bun.*server/src/index.ts" 2>/dev/null || true
pkill -f "bun.*worker/src/index.ts" 2>/dev/null || true

# 1. Start agent-computer
echo "Starting agent-computer on :4100..."
(cd agent-computer && \
  PORT=4100 \
  WORKSPACE_DIR="$HOME/.openbot/workspace" \
  PROFILES_DIR="$HOME/.openbot/profiles" \
  bun src/index.ts > "$LOGS/agent-computer.log" 2>&1 &)

# 2. Start agent-langgraph
echo "Starting agent-langgraph on :4201..."
(cd agent-langgraph && \
  PORT=4201 \
  BOT_PROVIDER="${BOT_PROVIDER:-openai}" \
  OPENAI_BASE_URL="${OPENAI_BASE_URL:-http://127.0.0.1:20128/v1}" \
  OPENAI_API_KEY="${OPENAI_API_KEY:-sk-local}" \
  BOT_MODEL="${BOT_MODEL:-antigravity/gemini-3.8-flash-tiered}" \
  bun src/index.ts > "$LOGS/agent-langgraph.log" 2>&1 &)

# Wait for them to answer health
for i in {1..15}; do
  if curl -fsS http://localhost:4100/health >/dev/null 2>&1 && \
     curl -fsS http://localhost:4201/health >/dev/null 2>&1; then
    echo "✓ agent-computer & agent-langgraph ready"
    break
  fi
  sleep 1
done

# 3. Start server
echo "Starting server on :3001..."
(cd server && \
  bun --env-file=../.env src/production-entry.ts > "$LOGS/server.log" 2>&1 &)

for i in {1..20}; do
  if curl -fsS http://localhost:3001/health >/dev/null 2>&1; then
    echo "✓ OpenBot API server ready on http://localhost:3001"
    break
  fi
  sleep 1
done

# 4. Start app
echo "Starting app on :3010..."
(cd app && \
  bun run dev --port 3010 --strictPort > "$LOGS/app.log" 2>&1 &)

for i in {1..20}; do
  if curl -fsS http://localhost:3010 >/dev/null 2>&1; then
    echo "✓ OpenBot UI ready on http://localhost:3010"
    break
  fi
  sleep 1
done

echo
echo "OpenBot is fully running locally without Docker!"
echo "UI:  http://localhost:3010"
echo "API: http://localhost:3001"
echo "Logs are available in $LOGS/"
