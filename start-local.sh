#!/bin/bash

# start-local.sh

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to get process using a port
get_port_process() {
    lsof -i :$1 -sTCP:LISTEN
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Function to prefix output lines
prefix_output() {
    prefix="$1"
    while IFS= read -r line; do
        echo "$prefix $line"
    done
}


# Set up trap for cleanup on script termination
trap cleanup EXIT INT TERM

# Check required ports
REQUIRED_PORTS=(8000 3000)
PORTS_IN_USE=false

echo "Checking required ports..."
for port in "${REQUIRED_PORTS[@]}"; do
    if check_port "$port"; then
        echo "⚠️  Port $port is in use by:"
        get_port_process "$port"
        PORTS_IN_USE=true
    fi
done

if [ "$PORTS_IN_USE" = true ]; then
    echo "Please free up the required ports and try again."
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables..."
    set -a
    source .env
    set +a
else
    echo "Error: .env file not found"
    exit 1
fi

# Check for required environment variables
required_vars=("REPLICATE_API_TOKEN" "ANTHROPIC_API_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env file"
        exit 1
    fi
done

# Export default URLs if not set
export FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
export NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}

echo "
🚀 Starting Visual Whispers in development mode...

📱 Frontend will be available at: $FRONTEND_URL
🔌 Backend API will be available at: $NEXT_PUBLIC_BACKEND_URL

💡 Press Ctrl+C to stop both servers
"

# Start backend in background with output
echo "Starting frontend and backend server..."
npm run dev

