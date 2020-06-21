#!/usr/bin/env bash

# Set the tmp directory inside /app so we preserve it in remixes.
export TMP=/app/.tmp
# We set max old space size to a very small number because parcel uses multiple processes
export NODE_OPTIONS="--max-old-space-size=256"

# apply patches to make Parcel use only one CPU
cp .patches/cpuCount.js node_modules/parcel-bundler/lib/utils/cpuCount.js
cp .patches/cpuCount.js node_modules/parcel-bundler/src/utils/cpuCount.js

while true; do
  echo "Wait for first build..."
  node_modules/.bin/parcel watch \
    --no-autoinstall \
    index.html
  echo "parcel watch crashed"
  sleep 1
done
