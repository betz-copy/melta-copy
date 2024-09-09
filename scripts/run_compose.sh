#!/usr/bin/env bash

bash $(dirname $0)/on_compose.sh up -d --build && bash $(dirname $0)/on_compose.sh restart nginx
