#!/bin/bash

TODAY=$(date +'%d-%m')

FOLDER_NAME="halbana-${TODAY}"
SEVEN_Z_FILE="${FOLDER_NAME}.7z"

# Check for --build argument
BUILD_IMAGES=false
for arg in "$@"; do
  if [ "$arg" == "--build" ]; then
    BUILD_IMAGES=true
    break
  fi
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
IMAGES=$(cat docker-compose.yml | grep "build:" | awk '{print $2}' | grep -v -F -f ./scripts/forbidden-images.txt | sed -e 's|^\./||' -e 's/^/melta-/' -e '/^melta_build:/d')
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
