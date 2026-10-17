# One image: the Next.js app is exported to static files and served by FastAPI,
# so there is a single origin (no CORS, no API URL baked into the build).
# Base images are multi-arch, so this builds natively on amd64 and arm64.

FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=
RUN npm run build

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 DATA_DIR=/data STATIC_DIR=/app/static
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=web /web/out ./static
VOLUME /data
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
