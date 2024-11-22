#!/bin/bash

# cleanup-prod.sh

echo "🧹 Cleaning up Visual Whispers production environment..."

# Stop all containers including orphans
echo "Stopping all containers..."
docker-compose -f docker-compose-prod.yml --env-file .env down --remove-orphans

# Force remove any remaining containers with our project name
echo "Removing any orphaned containers..."
docker ps -a | grep "visual-whispers" | awk '{print $1}' | xargs -r docker rm -f

# List all networks
echo "Checking for stuck networks..."
NETWORK_ID=$(docker network ls | grep "visual-whispers" | awk '{print $1}')

if [ ! -z "$NETWORK_ID" ]; then
    echo "Found Visual Whispers network, attempting to remove..."
    
    # Get containers using the network
    CONNECTED_CONTAINERS=$(docker network inspect $NETWORK_ID | grep "Name" | grep "visual-whispers" | cut -d'"' -f4)
    
    if [ ! -z "$CONNECTED_CONTAINERS" ]; then
        echo "Stopping containers connected to network:"
        echo "$CONNECTED_CONTAINERS"
        echo "$CONNECTED_CONTAINERS" | xargs -r docker stop
        echo "$CONNECTED_CONTAINERS" | xargs -r docker rm
    fi
    
    # Force remove the network
    docker network rm $NETWORK_ID || docker network rm -f $NETWORK_ID
fi

# Final check
REMAINING_CONTAINERS=$(docker ps -a | grep "visual-whispers" | wc -l)
REMAINING_NETWORKS=$(docker network ls | grep "visual-whispers" | wc -l)

if [ "$REMAINING_CONTAINERS" -eq 0 ] && [ "$REMAINING_NETWORKS" -eq 0 ]; then
    echo "✨ Cleanup completed successfully!"
else
    echo "⚠️  Some resources couldn't be removed automatically. You might need to restart Docker."
    echo "Remaining containers: $REMAINING_CONTAINERS"
    echo "Remaining networks: $REMAINING_NETWORKS"
    
    echo "
To manually clean up, you can try:
1. Restart Docker:
   sudo systemctl restart docker

2. Or remove resources manually:
   docker rm -f \$(docker ps -a | grep visual-whispers | awk '{print \$1}')
   docker network prune
"
fi