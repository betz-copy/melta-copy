#!/bin/sh

export JAVA_HOME=/usr/lib/jvm/jdk-11.0.6 # used in neo4j-admin command. need to set because crontab doesnt load enviorments of bash

BACKUPS_DIR=$1 # for example: /data/neo4j-melta/neo4j-enterprise-4.4.18/dumps/daily
MINS_TO_DELETE=$2 # for example: 10080 (7 days in mins)
RSYNC_OTHER_DIRECTORY_PATH=$3 # will skip if not given path. for example: /root/persistent-storage/neo4j-melta/dumps/daily

NEW_BACKUP_DIR="$BACKUPS_DIR/backup-$(date +%FT%H:%M:%S)"

echo "Creating backup of $NEW_BACKUP_DIR"

mkdir "$NEW_BACKUP_DIR"

# (&& to ensure deleting old backups only if successfuly created new)
/data/neo4j-melta/neo4j-enterprise-4.4.18/bin/neo4j-admin backup --backup-dir "$NEW_BACKUP_DIR" &&
# mkdir $NEW_BACKUP_DIR/neo4j &&  # fake backup, for debugging
find "$BACKUPS_DIR" -name "backup-*" -type d -mtime +$MINS_TO_DELETE -exec rm -r {} +

if [ $RSYNC_OTHER_DIRECTORY_PATH ]
then
  echo "mirroring backups to dir named: $RSYNC_OTHER_DIRECTORY_PATH"
  rsync --ignore-existing --delete-after --recursive "$BACKUPS_DIR/" "$RSYNC_OTHER_DIRECTORY_PATH"
fi
