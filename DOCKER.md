# Docker Setup

This project uses docker-compose for both development and production environments. The setup includes BuildKit for optimized builds.

## Prerequisites

1. Install Docker BuildKit:
```bash
# On Linux
DOCKER_BUILDKIT=1 docker build .

# On Windows (PowerShell)
$env:DOCKER_BUILDKIT=1
docker build .
```

2. Enable BuildKit by default (recommended):
   
Create or edit `/etc/docker/daemon.json`:
```json
{
  "features": {
    "buildkit": true
  }
}
```

Or set in your shell:
```bash
# Bash
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc

# Zsh
echo 'export DOCKER_BUILDKIT=1' >> ~/.zshrc
source ~/.zshrc
```

## Development Setup

1. Enable BuildKit (if not enabled):
```bash
# Linux/macOS
export DOCKER_BUILDKIT=1

# Windows (PowerShell)
$env:DOCKER_BUILDKIT=1
```

2. Create environment files:

Backend `.env`:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the development environment:
```bash
docker-compose up
```

The development setup includes:
- Hot reloading for both frontend and backend
- Source code mounting
- Debug capabilities
- Local environment variables

## Production Setup

1. Create production environment file:
```bash
# Copy the example file
cp .env.prod.example .env.prod

# Edit with your production values
nano .env.prod
```

2. Deploy to production:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## Available Commands

### Development
```bash
# Start services
docker-compose up

# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

### Production
```bash
# Start production stack
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs

# Update production services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Project Structure
```
visual-whispers/
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration
├── .env.prod.example          # Production environment template
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   └── .env                   # Development environment (git-ignored)
└── frontend/
    ├── Dockerfile
    ├── .env.example
    └── .env.local             # Development environment (git-ignored)
```

## Environment Files

### Development
- `backend/.env`: Backend development variables
- `frontend/.env.local`: Frontend development variables

### Production
- `.env.prod`: Production environment variables (created from `.env.prod.example`)

## Volumes and Persistence

### Development
```yaml
volumes:
  - ./backend:/app              # Backend code
  - /app/__pycache__           # Exclude Python cache
  - /app/.pytest_cache         # Exclude test cache
  - ./frontend:/app            # Frontend code
  - /app/node_modules          # Node modules
  - /app/.next                 # Next.js build
```

### Production
Production setup uses built images without source code mounting for security and performance.

## Networks

All services run on a dedicated network:
```yaml
networks:
  visual-whispers-net:
    driver: bridge
```

## Troubleshooting

### Build Issues
```bash
# Clear BuildKit cache
docker builder prune

# Force rebuild without cache
docker-compose build --no-cache

# View build details
docker-compose build --progress=plain
```

### Runtime Issues
```bash
# Check service status
docker-compose ps

# Check container logs
docker-compose logs [service_name]

# Restart services
docker-compose restart

# Rebuild and restart specific service
docker-compose up -d --build [service_name]
```

### Common Problems

1. Port conflicts:
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8000
```

2. Volume permissions:
```bash
# Fix permissions if needed
sudo chown -R $USER:$USER backend/
sudo chown -R $USER:$USER frontend/
```

3. Environment variables not loading:
```bash
# Verify env files
docker-compose config

# Check environment in container
docker-compose exec backend env
docker-compose exec frontend env
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove everything including images
docker-compose down --rmi all -v
```

## Best Practices

1. Never commit sensitive environment files
2. Use BuildKit for faster builds
3. Use production configuration in deployment
4. Always use specific versions in requirements
5. Regularly update base images and dependencies

## Additional Notes

- Development setup provides hot-reloading and debugging capabilities
- Production setup optimizes for security and performance
- BuildKit improves build performance and caching
- Environment variables are handled securely in production