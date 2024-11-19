# Use Node.js as base image since it's easier to add Python than vice versa
FROM node:20-slim

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy Python requirements and install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip3 install -r backend/requirements.txt

# Copy the rest of the application
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Create downloads directory
RUN mkdir -p backend/downloads

# Build frontend
RUN cd frontend && npm run build

# Copy the start script
COPY start.sh ./
RUN chmod +x start.sh

# Expose ports
EXPOSE 3000 8000

# Start both services
CMD ["./start.sh"]