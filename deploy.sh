#!/bin/bash

# Deployment Script for TaskMaster Pro

echo "🚀 Starting deployment for TaskMaster Pro..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "📦 Building and starting containers..."
# Use Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build and start in detached mode
docker-compose up --build -d

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  echo "🌐 App is running at: http://localhost:3000"
  echo "📝 Viewing logs (Press Ctrl+C to exit logs, app will keep running)..."
  sleep 2
  docker-compose logs -f
else
  echo "❌ Error: Deployment failed."
  exit 1
fi
