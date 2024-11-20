# Docker Setup

This project uses Docker Compose to run the frontend and backend services separately, which is ideal for development and provides better service isolation.

## Project Structure
```
visual-whispers/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   └── .env
└── frontend/
    ├── Dockerfile
    └── .env.local
```

## Setup

1. Create environment files:

Backend `.env`:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Build and run:
```bash
# Build images
docker-compose build

# Start services
docker-compose up
```

Access the application:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Common Commands

```bash
# Start containers in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild and start
docker-compose up --build
```

## Development

For development with hot reloading:
```bash
# Start with volumes mounted
docker-compose up
```

Access containers:
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend bash
```

## Volumes and Persistence

The docker-compose.yml configuration includes:
- Frontend code mounting for hot reloading
- Backend code mounting for quick updates
- Downloads directory persistence
- Node modules and Next.js build caching

## Troubleshooting

1. Port conflicts:
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8000

# Stop containers and change ports in docker-compose.yml
```

2. Permission issues:
```bash
# Fix downloads directory permissions
sudo chown -R 1000:1000 backend/downloads
```

3. Container won't start:
```bash
# Check logs
docker-compose logs

# Verify environment variables
docker-compose config
```

## Cleanup

```bash
# Stop containers
docker-compose down

# Remove volumes too
docker-compose down -v

# Remove everything including images
docker-compose down --rmi all
```