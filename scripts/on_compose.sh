#!/usr/bin/env bash

# Detect correct compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "Docker Compose is not installed."
    exit 1
fi

MODE=$1
shift

if [ "$MODE" == "nodemon" ]; then
    # Nodemon mode: Include development and nodemon-specific config files and profiles
    $DOCKER_COMPOSE_CMD \
        -f docker-compose.yml \
        -f docker-compose.dev.yml \
        -f docker-compose.nodemon.yml \
        --profile common \
        --profile nodemon \
        "$@"
elif [ "$MODE" == "normal" ]; then 
    # Normal mode: Include only base and development config files
    $DOCKER_COMPOSE_CMD \
        -f docker-compose.yml \
        -f docker-compose.dev.yml \
        --profile common \
        "$@"
else
    # Fallback/Error handling if mode isn't recognized
    echo "Error: Unknown mode passed to on_compose.sh: $MODE"
    exit 1
fi