#!/usr/bin/env bash
# Run backend (FastAPI, auto-reload) and frontend (Next.js dev server) side by side.
#   ./start-local.sh          use the API keys in .env
#   ./start-local.sh --demo   offline demo: fake painter and describer, no keys needed
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "--demo" ]]; then
  export MOCK_PROVIDERS=1
  echo "🎭 Demo mode: offline stand-ins, no API keys used."
elif [[ ! -f .env ]]; then
  echo "No .env found. Copy .env.template to .env and add OPENROUTER_API_KEY, or run ./start-local.sh --demo"
  exit 1
fi

for port in 8000 3000; do
  if (exec 3<>/dev/tcp/127.0.0.1/$port) 2>/dev/null; then
    echo "Port $port is already in use. Stop whatever is running there and try again."
    exit 1
  fi
done

# Backend
if [[ ! -d backend/.venv ]]; then
  echo "Creating backend virtualenv..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements-dev.txt
fi
# Frontend
if [[ ! -d frontend/node_modules ]]; then
  echo "Installing frontend packages..."
  npm --prefix frontend ci --no-audit --no-fund
fi

trap 'kill 0' EXIT INT TERM
(cd backend && .venv/bin/uvicorn main:app --reload --port 8000) &
npm --prefix frontend run dev -- --port 3000 &

echo "
✨ Visual Whispers
   App:      http://localhost:3000
   API docs: http://localhost:8000/docs
   Ctrl+C stops both.
"
wait
