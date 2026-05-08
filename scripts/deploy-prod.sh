#!/bin/bash

# Manual Deployment Script for Oasis Dashboard (Production)
# This script replicates the logic in .gitlab-ci.yml for local use.

set -e

# 1. Load environment variables from .env.prod (only if not already set by CI)
if [ -z "$S3_ACCESS_KEY_ID" ]; then
    if [ -f .env.prod ]; then
        echo "📝 Loading environment variables from .env.prod"
        set -a
        source .env.prod
        set +a
    else
        echo "⚠️  Warning: S3_ACCESS_KEY_ID not set and .env.prod not found."
    fi
fi

echo "🚀 Starting Deployment to PRODUCTION..."

# Skip confirmation if running in CI, Jenkins, or if -y flag is passed
if [[ "$1" == "-y" ]] || [[ -n "$CI" ]] || [[ -n "$JENKINS_URL" ]]; then
    echo "⏩ Non-interactive mode detected. Skipping confirmation."
else
    echo "⚠️  WARNING: You are about to deploy to the live production site!"
    read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# 2. Build the project
echo "📦 Installing dependencies..."
if [[ -n "$JENKINS_URL" ]] || [[ -n "$CI" ]]; then
    npm ci
else
    npm install
fi

echo "🛠 Building static assets..."
# Only copy .env.prod if it exists; otherwise rely on environment variables
if [ -f .env.prod ]; then
    cp .env.prod .env
fi
# Use a portable background process to prevent hanging (Works on Mac and Linux)
npx nuxi generate &
NUXI_PID=$!
( sleep 60; kill -9 $NUXI_PID 2>/dev/null ) &
WATCHER_PID=$!
wait $NUXI_PID 2>/dev/null || echo "⚠️ Nuxt build finished or timed out, proceeding to upload..."
kill $WATCHER_PID 2>/dev/null

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
    # Cleanup (ignore errors if folder is locked)
    rm -rf obsutil_linux_amd64.tar.gz obsutil_linux_amd64_* 2>/dev/null || true
fi

# 4. Configure obsutil
echo "⚙️ Configuring obsutil..."
./obsutil config -i=$S3_ACCESS_KEY_ID -k=$S3_SECRET_ACCESS_KEY -e=$S3_ENDPOINT

# 5. Upload to OBS
echo "☁️ Uploading to Huawei OBS (Production)..."
# Target path: root (empty) (-v adds a verbose progress bar)
./obsutil cp .output/public obs://$S3_BUCKET/ -f -r -v

echo "✅ Production Deployment Complete!"
echo "🔗 Check: https://oasis.kgmedia.id/"
