#!/usr/bin/env bash
# Publish merged viewer-request rewrites to CloudFront function flean-score-rewrite-index.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
FUNCTION_NAME="${CLOUDFRONT_FUNCTION_NAME:-flean-score-rewrite-index}"
FUNCTION_FILE="${ROOT}/cloudfront/product-deeplink-rewrite.js"

ETAG=$(aws cloudfront describe-function --name "$FUNCTION_NAME" --query 'ETag' --output text)

aws cloudfront update-function \
  --name "$FUNCTION_NAME" \
  --if-match "$ETAG" \
  --function-config "Comment=Landing page URI rewrites,Runtime=cloudfront-js-1.0" \
  --function-code "fileb://${FUNCTION_FILE}"

ETAG=$(aws cloudfront describe-function --name "$FUNCTION_NAME" --query 'ETag' --output text)

aws cloudfront publish-function \
  --name "$FUNCTION_NAME" \
  --if-match "$ETAG"

echo "Published ${FUNCTION_NAME} (LIVE)."
