#!/bin/bash

bash $(dirname $0)/on_compose.sh up -d --build && bash $(dirname $0)/on_compose.sh restart gateway