# syntax=docker/dockerfile:1.4
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with BuildKit cache
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Run the application
CMD ["npm", "start"]