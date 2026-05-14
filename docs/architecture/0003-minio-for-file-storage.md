---
adr: "0003"
title: "MinIO S3-compatible storage over Supabase Storage"
status: accepted
date: "2026-05-12"
deciders:
  - Engineering Lead
  - Infrastructure Lead
---

# ADR-0003 — MinIO for file storage

## Context

The original application used Supabase Storage (backed by S3-compatible buckets) for profile avatars, team files, and project attachments. File uploads went directly from the browser to Supabase using the anon key — no server-side validation.

After ADR-0001 removed Supabase, a replacement object store was needed that:
1. Can run on-premise via Docker
2. Is S3-compatible (Java SDK available)
3. Supports pre-signed URLs for direct client downloads
4. Allows server-side MIME validation before accepting files

## Decision

Use **MinIO** — a self-hosted, S3-compatible object store. Uploads go through the Spring Boot API:

1. Client `POST /api/v1/storage/{bucket}` with a multipart file
2. `UploadFileUseCase` reads the file bytes and uses **Apache Tika** to detect the real MIME type (not the `Content-Type` header, which is client-controlled)
3. The use case validates size (≤50 MB) and MIME type (allow-list)
4. File is stored in the appropriate MinIO bucket
5. A pre-signed download URL is returned (1-hour TTL)

## Buckets

| Bucket | Purpose |
|---|---|
| `hackhub-avatars` | Profile and team avatar images |
| `hackhub-team-files` | Files shared within teams |
| `hackhub-hackathon-assets` | Hackathon banner images |
| `hackhub-project-attachments` | Idea/project attachment files |

## Security improvements over Supabase Storage

- Files never touch the browser→storage path without server validation
- MIME type is detected from bytes, not the `Content-Type` header
- File size is enforced server-side before upload
- The MinIO port (9000) is never exposed to the public internet in production

## Consequences

**Positive:**
- Fully self-hosted, no dependency on external cloud storage
- Server-side MIME validation prevents malicious file type disguising
- Pre-signed URLs allow direct client downloads without proxying file bytes through the API

**Negative:**
- MinIO must be backed up separately (unlike Supabase's managed S3)
- Pre-signed URLs have a TTL — long-lived links require refresh

## Status

Implemented. `MinioStorageAdapter.java` implements `StoragePort`; `BucketInitializer.java` creates buckets on startup; `UploadFileUseCase.java` owns MIME validation.
