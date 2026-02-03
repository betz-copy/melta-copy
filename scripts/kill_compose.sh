#!/bin/bash

bash $(dirname $0)/on_compose.sh start down && bash $(dirname $0)/on_compose.sh start --profile analytics down