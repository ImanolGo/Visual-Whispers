#!/bin/bash

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

# Function to cleanup existing Docker resources
cleanup_docker() {
    echo "Cleaning up existing Docker resources..."
    docker-compose down
    echo "Waiting for ports to be released..."
    sleep 5
}

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
    echo -n "Would you like to stop conflicting processes and continue? (y/n) "
    read -r answer
    if [ "$answer" = "y" ]; then
        cleanup_docker
    else
        echo "Please free up the required ports and try again."
        exit 1
    fi
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

# Start the services
echo "Starting services with local configuration..."

if [ "$1" == "--build" ]; then
    docker-compose up --build
else
    docker-compose up
fi

echo "
🚀 Visual Whispers Local Environment is ready!

📱 Frontend: http://localhost:3000
🔌 Backend API: http://localhost:8000

📊 Monitoring:
  docker-compose logs -f

🛑 To stop:
  docker-compose down

💡 Note: Using environment from .env

To rebuild everything:
  ./start-local.sh --build
"