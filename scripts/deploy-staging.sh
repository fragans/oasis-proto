#!/bin/bash

# Manual Deployment Script for Oasis Dashboard (Staging)
# This script replicates the logic in .gitlab-ci.yml for local use.

set -e
echo "# 1. Load environment variables from .env.staging (only if not already set by CI)"
if [ -z "$S3_ACCESS_KEY_ID" ]; then
    if [ -f .env.staging ]; then
        echo "📝 Loading environment variables from .env.staging"
        set -a
        source .env.staging
        set +a
    else
        echo "⚠️  Warning: S3_ACCESS_KEY_ID not set and .env.staging not found."
    fi
fi

echo "🚀 Starting Deployment to STAGING..."

## Skip confirmation if running in CI, Jenkins, or if -y flag is passed
if [[ "$1" == "-y" ]] || [[ -n "$CI" ]] || [[ -n "$JENKINS_URL" ]]; then
    echo "⏩ Non-interactive mode detected. Skipping confirmation."
else
    echo "⚠️  WARNING: You are about to deploy to the staging environment!"
    read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo # 2. Build the project
echo "📦 Installing dependencies..."
if [[ -n "$JENKINS_URL" ]] || [[ -n "$CI" ]]; then
    npm ci
else
    npm install
fi

echo "🛠 Building static assets..."
# Only copy .env.staging if it exists; otherwise rely on environment variables
if [ -f .env.staging ]; then
    cp .env.staging .env
fi
## Use a portable background process to prevent hanging (Works on Mac and Linux)
npx nuxi generate &
NUXI_PID=$!
( sleep 60; kill -9 $NUXI_PID 2>/dev/null ) &
WATCHER_PID=$!
wait $NUXI_PID 2>/dev/null || echo "⚠️ Nuxt build finished or timed out, proceeding to upload..."
kill $WATCHER_PID 2>/dev/null

echo # 3. Handle obsutil (Huawei Cloud OBS Tool)
OBSUTIL_URL="https://obs-community-intl.obs.ap-southeast-1.myhuaweicloud.com/obsutil/current/obsutil_linux_amd64.tar.gz"

if [ ! -f ./obsutil ]; then
    echo "📥 Downloading obsutil..."
    curl -LO $OBSUTIL_URL
    tar -xzf obsutil_linux_amd64.tar.gz
    # Find the binary in the extracted folder
    OBS_BIN=$(find . -name obsutil -type f | grep linux_amd64 | head -n 1)
    cp "$OBS_BIN" ./obsutil
    chmod +x ./obsutil
    # Cleanup (ignore errors if folder is locked)
    rm -rf obsutil_linux_amd64.tar.gz obsutil_linux_amd64_* 2>/dev/null || true
fi

echo # 4. Configure obsutil
echo "⚙️ Configuring obsutil..."
./obsutil config -i=$S3_ACCESS_KEY_ID -k=$S3_SECRET_ACCESS_KEY -e=$S3_ENDPOINT

echo # 5. Upload to OBS
echo "☁️ Uploading to Huawei OBS (Staging)..."
## Target path: staging/ (-v adds a verbose progress bar)
./obsutil cp .output/public obs://$S3_BUCKET/staging/ -f -r -v

echo "✅ Deployment Complete!"
echo "🔗 Check: https://staging-oasis.kgmedia.id/"
