#!/bin/bash

printf "Pulling all images:\n"
./scripts/docker_pull_all_images.sh

printf "\nForbidden images:\n" 
cat ./scripts/forbidden-images.txt

printf "\nImages list:\n"
cat docker-compose.yml | grep "image:" | awk '{print $2}' | grep -v -F -f ./scripts/forbidden-images.txt

docker save -o images.tar `cat docker-compose.yml | grep "image:" | awk '{print $2}' | grep -v -F -f ./scripts/forbidden-images.txt`

printf "\nGenerated file:\n" 
du images.tar -h