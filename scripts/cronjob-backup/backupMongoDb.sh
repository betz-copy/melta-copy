#!/bin/sh


BACKUP_DIR=$1 # for example: /data/dumps/backup-2023-10-21T13:42:24/

# use uri of replicaSet, and add to connection readPreference=secondaryPreferred
# todo, should be run from outside of replica, not from one of the servers of replicaset
mongodump --uri '<insert mongodb connection>?readPreference=secondaryPreferred' "$BACKUP_DIR"
