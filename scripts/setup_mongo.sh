#!/usr/bin/env bash

set -euo pipefail

MONGODB_URI="mongodb://172.17.0.1:27017"

# Wait until mongod is ready
until mongosh "$MONGODB_URI" --quiet --eval 'db.adminCommand({ ping: 1 }).ok' | grep -q '1'; do
  echo "Waiting for MongoDB..."
  sleep 1
done

# Initiate replica set only if not initiated yet
mongosh "$MONGODB_URI" --quiet --eval '
  try {
    const status = rs.status();
    // If we got here, RS already initiated
    print("Replica set already initiated");
  } catch (e) {
    print("Initiating replica set...");
    rs.initiate({
      _id: "rs0",
      members: [{ _id: 0, host: "mongo:27017", priority: 2 }]
    });
  }
'
