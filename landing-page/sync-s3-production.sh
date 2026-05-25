#!/usr/bin/env bash
# Upload landing-page/ to production S3 + invalidate CloudFront.
# Mutating CSS/JS must NOT use immutable caching or browsers keep stale copies forever.

set -euo pipefail

BUCKET="${S3_BUCKET:-flean-web-ecom-website}"
REGION="${AWS_REGION:-ap-south-1}"
DIST="${CLOUDFRONT_DISTRIBUTION_ID:-EIQISUR48FJWY}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

OPTS=(--region "$REGION" --exclude ".DS_Store" --exclude "**/.DS_Store" --exclude "*.dmg")

echo "== Static assets (long cache; excludes HTML/CSS/JS/.well-known) =="
aws s3 sync "$ROOT/" "s3://${BUCKET}/" \
  "${OPTS[@]}" \
  --exclude "*.html" \
  --exclude "*.css" \
  --exclude "scripts/*" \
  --exclude ".well-known/*" \
  --cache-control "public, max-age=31536000, immutable"

echo "== CSS + loader JS (always revalidate) =="
aws s3 sync "$ROOT/" "s3://${BUCKET}/" \
  "${OPTS[@]}" \
  --exclude "*" \
  --include "*.css" \
  --include "scripts/*.js" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "== HTML (always revalidate) =="
aws s3 sync "$ROOT/" "s3://${BUCKET}/" \
  "${OPTS[@]}" \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "== .well-known App Links / AASA (explicit Content-Type + revalidate) =="
if [[ -f "$ROOT/.well-known/assetlinks.json" ]]; then
  aws s3 cp "$ROOT/.well-known/assetlinks.json" "s3://${BUCKET}/.well-known/assetlinks.json" \
    --region "$REGION" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/json"
fi
if [[ -f "$ROOT/.well-known/apple-app-site-association" ]]; then
  aws s3 cp "$ROOT/.well-known/apple-app-site-association" \
    "s3://${BUCKET}/.well-known/apple-app-site-association" \
    --region "$REGION" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/json"
fi

echo "== CloudFront invalidation =="
aws cloudfront create-invalidation \
  --distribution-id "$DIST" \
  --paths "/*" \
  --region "$REGION" \
  --query 'Invalidation.{Id:Id,Status:Status}' \
  --output text

echo "Done."
