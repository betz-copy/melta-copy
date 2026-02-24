#!/bin/sh
# Always run the app with node (avoids "no workspace found" when K8s overrides command with pnpm)
# Requires SERVICE_NAME to be set in the image (env or default).
exec node --async-stack-traces "${SERVICE_NAME}/dist/index.js"
