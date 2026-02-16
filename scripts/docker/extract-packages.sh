#!/bin/sh
# Extract only package.json and dist from packages that were built (have dist folder)
# Turborepo only builds dependencies, so only those will have dist folders

mkdir -p packages

for pkg in packages-temp/*/; do
    pkgname=$(basename "$pkg")
    if [ -d "$pkg/dist" ]; then
        mkdir -p "packages/$pkgname"
        cp "$pkg/package.json" "packages/$pkgname/"
        cp -r "$pkg/dist" "packages/$pkgname/"
    fi
done

rm -rf packages-temp

