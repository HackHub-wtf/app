#!/bin/bash
# Generates an RS256 key pair for JWT signing.
# Outputs single-line PEM values suitable for .env / Docker environment variables.
#
# Usage: bash scripts/generate-jwt-keys.sh
# Then paste the output into .env as JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.

set -e

TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

openssl genrsa -out "$TMP/private.pem" 2048 2>/dev/null
openssl rsa -in "$TMP/private.pem" -pubout -out "$TMP/public.pem" 2>/dev/null

echo "# Paste these into your .env file"
echo ""
printf 'JWT_PRIVATE_KEY="%s"\n' "$(awk 'NF{printf "%s\\n",$0}' "$TMP/private.pem")"
echo ""
printf 'JWT_PUBLIC_KEY="%s"\n' "$(awk 'NF{printf "%s\\n",$0}' "$TMP/public.pem")"
echo ""
echo "# Keys generated successfully. Keep JWT_PRIVATE_KEY secret."
