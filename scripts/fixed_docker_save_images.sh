#!/bin/bash

TODAY=$(date +'%d-%m')

FOLDER_NAME="halbana-${TODAY}"
SEVEN_Z_FILE="${FOLDER_NAME}.7z"

# Initialize variables
BUILD_IMAGES=false
SPECIFIC_SERVICES=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD_IMAGES=true
      shift
      ;;
    --services)
      shift
      while [[ $# -gt 0 && ! $1 =~ ^-- ]]; do
        SPECIFIC_SERVICES+=("$1")
        shift
      done
      ;;
    *)
      shift
      ;;
  esac
done

# Build images if needed
if [ "$BUILD_IMAGES" = true ]; then
  echo "Building Docker images..."
  ./scripts/docker_build_all_images.sh
  echo "Docker images built."
fi

# Prepare folder
if [ -d "$FOLDER_NAME" ]; then
  rm -rf "$FOLDER_NAME"
  echo "The folder $FOLDER_NAME already exists and was removed."
fi
mkdir "$FOLDER_NAME"
echo "The new folder $FOLDER_NAME just created."

# List images
IMAGES=$(cat docker-compose.yml | grep -A1 "build:" | grep -E "build:|context:" | awk '{print $2}' | grep -v -F -f ./scripts/forbidden-images.txt | sed -e 's|^\./||' -e 's/^/melta-/' -e '/^melta_build:/d' -e 's/\/$//' -e 's/-service$/-service/')

# Filter images if specific services are provided
if [ ${#SPECIFIC_SERVICES[@]} -gt 0 ]; then
  echo "Processing only specified services: ${SPECIFIC_SERVICES[*]}"
  FILTERED_IMAGES=""
  for service in "${SPECIFIC_SERVICES[@]}"; do
    SERVICE_IMAGE=$(echo "$IMAGES" | grep "melta-$service")
    if [ ! -z "$SERVICE_IMAGE" ]; then
      FILTERED_IMAGES="$FILTERED_IMAGES $SERVICE_IMAGE"
    else
      echo "Warning: Service '$service' not found in available images"
    fi
  done
  IMAGES="$FILTERED_IMAGES"
fi

echo -e "\nImages list:\n$IMAGES"

# Save Docker images and compress each to .7z
for image in $IMAGES; do
  IMAGE_NAME=$(echo "$image" | cut -d ':' -f 1)

  TAR_FILE="${FOLDER_NAME}/${IMAGE_NAME}_${TODAY}.tar"
  SEVEN_Z_FILE="${FOLDER_NAME}/${IMAGE_NAME}_${TODAY}.7z"

  # Check if the image exists
  if ! docker image inspect "$image" > /dev/null 2>&1; then
    echo "Error: Docker image $image not found."
    continue
  fi

  # Save the Docker image as a .tar file
  docker save "$image" -o "$TAR_FILE"
  echo "Docker image $image saved as $TAR_FILE."

  # Compress the .tar file into a .7z file
  if ! command -v 7z &> /dev/null; then
    echo "Error: 7z utility not found. Please install it to continue."
    exit 1
  fi

  7z a "$SEVEN_Z_FILE" "$TAR_FILE"
  echo "Compressed $TAR_FILE to $SEVEN_Z_FILE."

  # Remove the original .tar file after compression
  rm "$TAR_FILE"
  echo "Removed the original tar file $TAR_FILE."
done

echo "All images are ready and compressed individually to .7z files in the folder $FOLDER_NAME."
