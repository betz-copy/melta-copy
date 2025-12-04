#!/usr/bin/env bash

MODE=$1
shift

if [ "$MODE" == "nodemon" ]; then
    # nodemon mode: Start services and then ensure Nginx is restarted.
    bash "$(dirname "$0")/on_compose.sh" nodemon up -d --build "$@"
    
    # Restart Nginx to load the correct service IPs for hot-reloaded service
    bash "$(dirname "$0")/on_compose.sh" nodemon restart nginx

else
    # normal mode: Start services, then restart Nginx.
    bash "$(dirname "$0")/on_compose.sh" normal up -d --build "$@"
    
    # Ensure Nginx is restarted to load services
    bash "$(dirname "$0")/on_compose.sh" normal restart nginx
fi