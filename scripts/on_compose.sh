#!/usr/bin/env bash

# Check for Docker Compose version
if docker compose version &> /dev/null; then
    # New Docker Compose (v2+) command is available
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    # Old Docker Compose command is available
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "Docker Compose is not installed."
    exit 1
fi

$DOCKER_COMPOSE_CMD -f docker-compose.yml -f docker-compose.dev.yml --profile common "$@"
