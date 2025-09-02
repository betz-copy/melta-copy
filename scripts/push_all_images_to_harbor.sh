#!/bin/bash

HARBOR_REGISTRY="harborreg-2.northeurope.cloudapp.azure.com"  
HARBOR_PROJECT="meltaot"         
HARBOR_USERNAME="meltaot"             
HARBOR_PASSWORD="Meltaot-password123"             

# Function to prompt for credentials if not provided
# prompt_credentials() {
#     if [ "$HARBOR_USERNAME" = "meltaot" ]; then
#         echo "Please enter your Harbor username:"
#         read -r HARBOR_USERNAME
#     fi
    
#     if [ "$HARBOR_PASSWORD" = "Meltaot-password123" ]; then
#         echo "Please enter your Harbor password:"
#         read -s HARBOR_PASSWORD
#         echo
#     fi
# }

# Function to login to Harbor
login_to_harbor() {
    echo "Logging in to Harbor registry: $HARBOR_REGISTRY"
    echo "$HARBOR_PASSWORD" | docker login "$HARBOR_REGISTRY" -u "$HARBOR_USERNAME" --password-stdin
    
    if [ $? -eq 0 ]; then
        echo "Successfully logged in to Harbor"
    else
        echo "Failed to login to Harbor. Please check your credentials."
        exit 1
    fi
}

# Check if credentials are provided or prompt for them
prompt_credentials

# Login to Harbor
login_to_harbor

IMAGES=$(cat docker-compose.yml | grep -A1 "SERVICE_NAME:" | grep -E "SERVICE_NAME:|context:" | awk '{print $2}' | grep -v -F -f ./scripts/forbidden-images.txt | sed -e 's|^\./||' | sed 's/"//g' | sed "s/'//g")

echo "Pushing all the following images to Harbor project '$HARBOR_PROJECT': $IMAGES"

for image in $IMAGES; do
    echo "Tagging $image to Harbor"
    docker tag melta-$image:latest "$HARBOR_REGISTRY/$HARBOR_PROJECT/$image:latest"
done

for image in $IMAGES; do
    echo "Pushing $image to Harbor"
    docker push "$HARBOR_REGISTRY/$HARBOR_PROJECT/$image:latest"
done

echo "All images pushed successfully to Harbor!"