#!/bin/sh
# Flatten nested dist structure if needed

SERVICE_NAME="$1"

if [ -z "$SERVICE_NAME" ]; then
    echo "Error: SERVICE_NAME argument is required"
    exit 1
fi

if [ -d "${SERVICE_NAME}/dist-temp/${SERVICE_NAME}/src" ]; then
    mkdir -p "${SERVICE_NAME}/dist"
    cp -r "${SERVICE_NAME}/dist-temp/${SERVICE_NAME}/src/"* "${SERVICE_NAME}/dist/"
    rm -rf "${SERVICE_NAME}/dist-temp"
else
    mv "${SERVICE_NAME}/dist-temp" "${SERVICE_NAME}/dist"
fi

