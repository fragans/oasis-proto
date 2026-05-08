#!/bin/bash

# Manual Deployment Script for Oasis Dashboard (Staging)
# This script replicates the logic in .gitlab-ci.yml for local use.

set -e

# 1. Load environment variables from .env.staging
if [ -f .env.staging ]; then
    export $(grep -v '^#' .env.staging | xargs)
else
    echo "Error: .env.staging file not found!"
    exit 1
fi

echo "🚀 Starting Manual Deployment to Staging..."

# 2. Build the project
echo "📦 Installing dependencies..."
npm install

echo "🛠 Building static assets..."
cp .env.staging .env
npx nuxi generate

# 3. Handle obsutil (Huawei Cloud OBS Tool)
OBSUTIL_URL="https://obs-community-intl.obs.ap-southeast-1.myhuaweicloud.com/obsutil/current/obsutil_linux_amd64.tar.gz"

if [ ! -f ./obsutil ]; then
    echo "📥 Downloading obsutil..."
    curl -LO $OBSUTIL_URL
    tar -xzf obsutil_linux_amd64.tar.gz
    # Find the binary in the extracted folder
    OBS_BIN=$(find . -name obsutil -type f | grep linux_amd64 | head -n 1)
    cp "$OBS_BIN" ./obsutil
    chmod +x ./obsutil
    # Cleanup
    rm -rf obsutil_linux_amd64.tar.gz obsutil_linux_amd64_*
fi

# 4. Configure obsutil
echo "⚙️ Configuring obsutil..."
./obsutil config -i=$S3_ACCESS_KEY_ID -k=$S3_SECRET_ACCESS_KEY -e=$S3_ENDPOINT

# 5. Upload to OBS
echo "☁️ Uploading to Huawei OBS (Staging)..."
# Target path: staging/
./obsutil cp .output/public obs://$S3_BUCKET/staging/ -f -r

echo "✅ Deployment Complete!"
echo "🔗 Check: https://staging-oasis.kgmedia.id/"
