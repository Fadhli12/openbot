#!/usr/bin/env bash
set -euo pipefail

echo "Stopping OpenBot local processes..."

pkill -f "bun.*agent-computer/src/index.ts" 2>/dev/null || true
pkill -f "bun.*agent-langgraph/src/index.ts" 2>/dev/null || true
pkill -f "bun.*agent-bot/src/index.ts" 2>/dev/null || true
pkill -f "bun.*server/src/production-entry.ts" 2>/dev/null || true
pkill -f "bun.*server/src/index.ts" 2>/dev/null || true
pkill -f "bun.*worker/src/index.ts" 2>/dev/null || true
pkill -f "vite.*--port 3010" 2>/dev/null || true

echo "All local OpenBot processes stopped."
