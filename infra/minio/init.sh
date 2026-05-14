#!/bin/sh
# Creates required MinIO buckets on first run.
# Runs as the minio-init service after MinIO is healthy.

set -e

mc alias set local http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

for bucket in hackhub-avatars hackhub-team-files hackhub-hackathon-assets hackhub-project-attachments hackhub-team-avatars; do
  if mc ls "local/${bucket}" > /dev/null 2>&1; then
    echo "bucket ${bucket} already exists — skipping"
  else
    mc mb "local/${bucket}"
    echo "created bucket ${bucket}"
  fi
done

echo "MinIO bucket init complete"
