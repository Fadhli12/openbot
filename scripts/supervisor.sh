#!/usr/bin/env bash
set -uo pipefail

ROOT="/Users/ant.fadhli/Project/openbot"
LOGS="$ROOT/.logs"
SUPERVISOR_LOG="$LOGS/supervisor.log"
mkdir -p "$LOGS" "$HOME/.openbot/workspace" "$HOME/.openbot/profiles"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$SUPERVISOR_LOG"
}

log "OpenBot supervisor started."

check_and_start_agent_computer() {
  if ! curl -fsS http://localhost:4100/health >/dev/null 2>&1; then
    log "agent-computer (:4100) not responding. Restarting..."
    pkill -f "bun.*agent-computer/src/index.ts" 2>/dev/null || true
    (
      cd "$ROOT/agent-computer" || exit 1
      PORT=4100 \
      WORKSPACE_DIR="$HOME/.openbot/workspace" \
      PROFILES_DIR="$HOME/.openbot/profiles" \
      /opt/homebrew/bin/bun src/index.ts >> "$LOGS/agent-computer.log" 2>&1
    ) &
    log "Spawned agent-computer process."
  fi
}

check_and_start_agent_langgraph() {
  if ! curl -fsS http://localhost:4201/health >/dev/null 2>&1; then
    log "agent-langgraph (:4201) not responding. Restarting..."
    pkill -f "bun.*agent-langgraph/src/index.ts" 2>/dev/null || true
    (
      cd "$ROOT/agent-langgraph" || exit 1
      PORT=4201 \
      BOT_PROVIDER="${BOT_PROVIDER:-openai}" \
      OPENAI_BASE_URL="${OPENAI_BASE_URL:-http://127.0.0.1:20128/v1}" \
      OPENAI_API_KEY="${OPENAI_API_KEY:-sk-local}" \
      BOT_MODEL="${BOT_MODEL:-antigravity/gemini-3.8-flash-tiered}" \
      /opt/homebrew/bin/bun src/index.ts >> "$LOGS/agent-langgraph.log" 2>&1
    ) &
    log "Spawned agent-langgraph process."
  fi
}

check_and_start_server() {
  if ! curl -fsS http://localhost:3001/health >/dev/null 2>&1; then
    log "server (:3001) not responding. Restarting..."
    pkill -f "bun.*server/src/production-entry.ts" 2>/dev/null || true
    pkill -f "bun.*server/src/index.ts" 2>/dev/null || true
    (
      cd "$ROOT/server" || exit 1
      /opt/homebrew/bin/bun --env-file=../.env src/production-entry.ts >> "$LOGS/server.log" 2>&1
    ) &
    log "Spawned server process."
  fi
}

check_and_start_app() {
  if ! curl -fsS http://localhost:3010 >/dev/null 2>&1; then
    log "app UI (:3010) not responding. Restarting..."
    pkill -f "vite.*--port 3010" 2>/dev/null || true
    (
      cd "$ROOT/app" || exit 1
      /opt/homebrew/bin/bun run dev --port 3010 --strictPort >> "$LOGS/app.log" 2>&1
    ) &
    log "Spawned app UI process."
  fi
}

cleanup() {
  log "OpenBot supervisor received termination signal. Exiting."
  exit 0
}

trap cleanup SIGINT SIGTERM

while true; do
  # Verify prerequisites
  if /opt/homebrew/bin/pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    check_and_start_agent_computer
    check_and_start_agent_langgraph
    check_and_start_server
    check_and_start_app
  else
    log "Warning: PostgreSQL on port 5432 is not ready. Waiting..."
  fi

  sleep 10
done
