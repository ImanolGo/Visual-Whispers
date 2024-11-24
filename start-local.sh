#!/bin/bash

# Function to detect system architecture and normalize it
get_architecture() {
    local arch=$(uname -m)
    case $arch in
        x86_64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l|armv7)
            echo "arm/v7"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Get and store architecture
ARCHITECTURE=$(get_architecture)
echo "Detected architecture: $ARCHITECTURE"

# Export for docker-compose
export ARCHITECTURE
export DOCKER_DEFAULT_PLATFORM=linux/$ARCHITECTURE

# Function to check if a port is in use
check_port() {
    if command -v lsof >/dev/null 2>&1; then
        # Use lsof if available (Unix/Linux/macOS)
        if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
            return 0
        else
            return 1
        fi
    else
        # Fallback to netstat (useful for some Linux distributions)
        if netstat -tuln | grep -q ":$1 "; then
            return 0
        else
            return 1
        fi
    fi
}

# Function to get process using a port
get_port_process() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :$1 -sTCP:LISTEN
    else
        netstat -tuln | grep ":$1 "
    fi
}

# Function to cleanup existing Docker resources
cleanup_docker() {
    echo "Cleaning up existing Docker resources..."
    DOCKER_DEFAULT_PLATFORM=linux/$ARCHITECTURE docker-compose down
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
echo "Starting services with local configuration for $ARCHITECTURE architecture..."

if [ "$1" == "--build" ]; then
    DOCKER_DEFAULT_PLATFORM=linux/$ARCHITECTURE docker-compose up --build
else
    DOCKER_DEFAULT_PLATFORM=linux/$ARCHITECTURE docker-compose up
fi

echo "
🚀 Visual Whispers Local Environment is ready!

📱 Frontend: http://localhost:3000
🔌 Backend API: http://localhost:8000
🔧 Architecture: $ARCHITECTURE

📊 Monitoring:
  docker-compose logs -f

🛑 To stop:
  docker-compose down

💡 Note: Using environment from .env

To rebuild everything:
  ./start-local.sh --build

System Information:
  Architecture: $ARCHITECTURE
  Platform: $(uname -s)
  Machine: $(uname -m)
"