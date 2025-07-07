#!/bin/bash

bash $(dirname $0)/on_compose.sh down && bash $(dirname $0)/on_compose.sh --profile analytics down