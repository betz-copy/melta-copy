#!/bin/bash

for file in $(find . -name *.yaml); do mkdir -p "$(dirname ./all-helms/$file)" && cp -r "$file" "./all-helms/$file" ; done
