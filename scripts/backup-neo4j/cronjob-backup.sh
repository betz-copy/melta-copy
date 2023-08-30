#!/bin/sh

export JAVA_HOME=/usr/lib/jvm/jdk-11.0.6 # used in neo4j-admin command. need to set because crontab doesnt load enviorments of bash

BACKUPS_DIR=$1 # for example: /data/neo4j-melta/neo4j-enterprise-4.4.18/dumps/daily
DAYS_TO_DELETE=$2 # for example: 7 (days)

NEW_BACKUP_DIR="$BACKUPS_DIR/backup-$(date +%FT%H:%M:%S)"

echo "Creating backup of $NEW_BACKUP_DIR"

mkdir $NEW_BACKUP_DIR

# (&& to ensure deleting old backups only if successfuly created new)
# /data/neo4j-melta/neo4j-enterprise-4.4.18/bin/neo4j-admin backup --backup-dir $NEW_BACKUP_DIR &&
mkdir $NEW_BACKUP_DIR/neo4j
find "$BACKUPS_DIR" -name "backup-*" -type d -mtime +$DAYS_TO_DELETE -exec rm -r {} +
