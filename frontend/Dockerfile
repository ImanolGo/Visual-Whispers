# syntax=docker/dockerfile:1.4
FROM --platform=$TARGETPLATFORM node:20-slim

# Accept the build arg and set it as an environment variable
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

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