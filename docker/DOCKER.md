# Simple Docker Setup for Visual Whispers

## Setup

1. Create `.env` file in the project root:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
ANTHROPIC_API_KEY=your_claude_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. Build the Docker image:
```bash
docker build -t visual-whispers .
```

3. Run the container:
```bash
docker run -it \
  -p 3000:3000 \
  -p 8000:8000 \
  --env-file .env \
  visual-whispers
```

## Usage

Once running, access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Development

To mount your local code for development:
```bash
docker run -it \
  -p 3000:3000 \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/frontend:/app/frontend \
  -v $(pwd)/backend:/app/backend \
  visual-whispers
```

## Stopping

To stop the container:
1. Find the container ID: `docker ps`
2. Stop it: `docker stop <container_id>`

## Logs

View logs: `docker logs <container_id>`
Follow logs: `docker logs -f <container_id>`