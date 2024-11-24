# syntax=docker/dockerfile:1.4
FROM --platform=$TARGETPLATFORM python:3.12-slim

# Accept the target architecture argument
ARG TARGETARCH
ARG TARGETPLATFORM

WORKDIR /app

# Install system dependencies with architecture-specific optimizations
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with BuildKit cache
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create downloads directory
RUN mkdir -p downloads

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]