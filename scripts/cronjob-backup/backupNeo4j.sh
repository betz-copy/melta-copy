#!/bin/sh


BACKUP_DIR=$1 # for example: /data/neo4j-melta/neo4j-enterprise-4.4.18/dumps/daily/backup-2023-10-21T13:42:24/

export JAVA_HOME=/usr/lib/jvm/jdk-11.0.6 # used in neo4j-admin command. need to set because crontab doesnt load enviorments of bash

/data/neo4j-melta/neo4j-enterprise-4.4.18/bin/neo4j-admin backup --backup-dir "$BACKUP_DIR"
