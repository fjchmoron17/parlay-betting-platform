#!/bin/bash
# Deploy script for Railway (auto-exit when finished)

set -e

echo "🚀 Starting Railway deployment..."

railway up

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Deployment completed successfully."
  exit 0
else
  echo "❌ Deployment failed with exit code $EXIT_CODE."
  exit $EXIT_CODE
fi
