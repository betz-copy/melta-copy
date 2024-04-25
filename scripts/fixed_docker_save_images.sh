#!/bin/bash

TODAY=$(date +'%d-%m')

FOLDER_NAME="halbana-${TODAY}"
SEVEN_Z_FILE="${FOLDER_NAME}.7z"

BUILD_IMAGES=false
for arg in "$@"; do
  if [ "$arg" == "--build" ]; then
    BUILD_IMAGES=true
    break
  fi
done

if [ "$BUILD_IMAGES" = true ]; then
  echo "Building Docker images..."
  ./scripts/docker_build_all_images.sh
  echo "Docker images built."
fi

if [ -d "$FOLDER_NAME" ]; then
  rm -rf "$FOLDER_NAME"
  echo "The folder $FOLDER_NAME already exists. And just removed."
fi
mkdir "$FOLDER_NAME"
echo "The new folder $FOLDER_NAME just created."

IMAGES=$(cat docker-compose.yml | grep "build:" | awk '{print $2}' | grep -v -F -f ./scripts/forbidden-images.txt |sed -e 's|^\./||' -e 's/^/melta_/' -e '/^melta_build:/d')
ehco "\nImages list:\n$IMAGES"


for image in $IMAGES; do
  IMAGE_NAME=$(echo "$image" | cut -d ':' -f 1)

  TAR_FILE="${FOLDER_NAME}/${IMAGE_NAME}_${TODAY}.tar.gz"

  docker save "$image" | gzip > "$TAR_FILE"
done

if [ -f "$SEVEN_Z_FILE" ]; then
  rm "$SEVEN_Z_FILE"
  echo "The 7z file $SEVEN_Z_FILE already exists. And just removed."
fi

7z a "$SEVEN_Z_FILE" "$FOLDER_NAME/*"
echo "Compressed the the folder $FOLDER_NAME with the builed images to file $SEVEN_Z_FILE."

rm -rf "$FOLDER_NAME"
echo "The folder $FOLDER_NAME just removed, after being compressed."

echo "All images are ready to halbana if file $SEVEN_Z_FILE."