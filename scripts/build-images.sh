#!/bin/bash
# Usage: ./scripts/build-images.sh     → services from SERVICES array below (comment/uncomment)
#        ./scripts/build-images.sh all → all services from docker-compose
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Comment/uncomment to choose which services run when no args
SERVICES=(
  'gateway-service'
  'frontend-service'
  # 'user-service'
  # 'storage-service'
  # 'template-service'
  # 'instance-service'
  # 'global-search-service'
  # 'activity-log-service'
  # 'notification-service'
  # 'rule-breach-service'
  # 'process-service'
  # 'gantt-service'
  # 'preview-service'
  # 'workspace-service'
  # 'dashboard-service'
  # 'cron-service'
  # 'semantic-service'
)

if [ "$1" = "all" ]; then
  IMAGES=$(grep "SERVICE_NAME:" docker-compose.yml | grep -v '^\s*#' | sed "s/.*SERVICE_NAME:\s*['\"]\?\([^'\" ]*\)['\"]\?.*/\1/" | grep -v -F -f ./scripts/forbidden-images.txt 2>/dev/null || true)
  if [ -z "$IMAGES" ]; then
    echo "No services found in docker-compose.yml (SERVICE_NAME). Check path and forbidden-images.txt."
    exit 1
  fi
  echo "Mode: all services from docker-compose"
elif [ $# -gt 0 ]; then
  echo "Unknown argument. Use no args (SERVICES array) or 'all'."
  exit 1
else
  IMAGES="${SERVICES[*]}"
  if [ -z "$IMAGES" ]; then
    echo "SERVICES array is empty. Uncomment at least one service in the script."
    exit 1
  fi
  echo "Mode: services from script (SERVICES array)"
fi

# Local image name: melta-<service>:latest (matches push_all_images_to_harbor.sh)
LOCAL_IMAGE_PREFIX="${LOCAL_IMAGE_PREFIX:-melta}"

# Optional: delete .tar files after creating them (set to true to enable)
DELETE_FILES="${DELETE_FILES:-false}"

format_date() {
  local n="$1"
  if [ "${#n}" -eq 1 ]; then
    echo "0${n}"
  else
    echo "${n}"
  fi
}

dd=$(format_date "$(date +%d)")
mm=$(format_date "$(date +%m)")
yyyy=$(date +%Y)
tag="${dd}-${mm}-${yyyy}"

mkdir -p "$tag"
cd "$tag"

echo "Saving local images for: $IMAGES"
echo "Tag: $tag | Output: $(pwd)"
echo ""

for service in $IMAGES; do
  local_image="${LOCAL_IMAGE_PREFIX}-${service}:latest"
  if ! docker image inspect "$local_image" &>/dev/null; then
    echo "Warning: local image $local_image not found, skipping."
    continue
  fi
  echo "Tagging and saving $service..."
  docker tag "$local_image" "${service}:${tag}"
  docker save "${service}:${tag}" -o "${service}-${tag}.tar"
done

if [ "$DELETE_FILES" = "true" ]; then
  echo "############################################################"
  echo "Deleting .tar files....."
  for service in $IMAGES; do
    rm -f "${service}-${tag}.tar"
  done
fi

cd "$REPO_ROOT"
ARCHIVE="${tag}.7z"
if command -v 7z &>/dev/null; then
  echo "Creating $ARCHIVE..."
  7z a -t7z "$ARCHIVE" "$tag"
  echo "Done. Archive: $REPO_ROOT/$ARCHIVE"
else
  echo "7z not found. Install p7zip-full (apt) or p7zip. Skipping archive."
fi
echo "Output directory: $REPO_ROOT/$tag"
