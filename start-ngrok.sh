#!/bin/bash

# start-prod.sh

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
    docker-compose -f docker-compose-prod.yml --env-file .env.prod down
    echo "Waiting for ports to be released..."
    sleep 5
}

# Check required ports
REQUIRED_PORTS=(8000 3000 4040 4041)
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

# Load production environment variables
if [ -f .env.prod ]; then
    echo "Loading production environment variables..."
    set -a
    source .env.prod
    set +a
else
    echo "Error: .env.prod file not found"
    exit 1
fi

# Check for required environment variables
required_vars=("NGROK_AUTHTOKEN" "REPLICATE_API_TOKEN" "ANTHROPIC_API_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env.prod file"
        exit 1
    fi
done

# Start the services with production compose file
echo "Starting services with production configuration..."
docker-compose -f docker-compose-prod.yml --env-file .env.prod up -d

# Wait for ngrok to start
echo "Waiting for ngrok tunnels to be established..."
sleep 10

# Get ngrok URLs
echo "Getting ngrok URLs..."
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
BACKEND_URL=$(curl -s http://localhost:4041/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
    echo "Error: Could not get ngrok URLs. Please check if ngrok services are running."
    docker-compose -f docker-compose-prod.yml --env-file .env.prod logs ngrok-frontend ngrok-backend
    exit 1
fi

echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"

# Update frontend with new backend URL
echo "Updating frontend configuration..."
export NEXT_PUBLIC_API_URL=$BACKEND_URL
docker-compose -f docker-compose-prod.yml --env-file .env.prod up -d --build frontend

echo "
🚀 Visual Whispers Production Environment is ready!

📱 Frontend: $FRONTEND_URL
🔌 Backend API: $BACKEND_URL
🔍 Frontend Tunnel Inspector: http://localhost:4040
🔍 Backend Tunnel Inspector: http://localhost:4041

📊 Monitoring:
  docker-compose -f docker-compose-prod.yml --env-file .env.prod logs -f

🛑 To stop:
  docker-compose -f docker-compose-prod.yml --env-file .env.prod down

💡 Note: Using environment from .env.prod

To stop everything and clean up:
  docker-compose -f docker-compose-prod.yml --env-file .env.prod down
"