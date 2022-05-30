#!/bin/bash

MONGODB='172.17.0.1:27017'

sleep 10

mongo --host "${MONGODB}" <<EOF
  const cfg = {
    "_id": "rs0",
    "version": 1,
    "members": [
      {
        "_id": 0,
        "host": "${MONGODB}",
        "priority": 2
      }
    ]
  };
  rs.initiate(cfg);
  rs.reconfig(cfg, { force: true });
EOF
