#!/bin/bash

# Manual Migration Script for Oasis Dashboard
# Usage: bash scripts/migrate.sh [staging|prod]

ENV=$1

if [ "$ENV" != "staging" ] && [ "$ENV" != "prod" ]; then
    echo "Usage: bash scripts/migrate.sh [staging|prod]"
    exit 1
fi

ENV_FILE=".env.$ENV"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: $ENV_FILE file not found!"
    exit 1
fi

echo "🚀 Starting Database Migration for $ENV..."

if [ "$ENV" == "prod" ]; then
    echo "⚠️  WARNING: You are about to run migrations against the PRODUCTION database!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi
fi

cp "$ENV_FILE" .env
echo "🛠 Running Drizzle migrations..."
npx drizzle-kit migrate

echo "✅ Migration Complete!"
