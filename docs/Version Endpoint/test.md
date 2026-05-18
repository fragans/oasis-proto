# Version Endpoint Testing

## Overview

The `/api/version` endpoint provides deployment information including commit SHA, branch, and environment. Data is captured automatically via a git post-push hook and stored in PostgreSQL.

## Implementation Status

✅ **COMPLETE**
- Database migration applied
- POST endpoint functional
- GET endpoint functional
- Git hook working (fixed for worktree compatibility)

## Testing Steps

### 1. Local Development Setup

```bash
cd /Users/surya/kompas/oasis-dashboard
npm run dev
```

Verify in server logs:
```
[DB] Migrations applied successfully
```

### 2. Manual POST Endpoint Test

```bash
curl -X POST http://localhost:3000/api/deployment-info \
  -H "Content-Type: application/json" \
  -d '{
    "commitShaShort": "abc1234",
    "commitShaFull": "abc123456789abcdef0123456789abcdef012345",
    "branch": "staging"
  }' | jq .
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "commit_sha_short": "abc1234",
    "commit_sha_full": "abc123456789abcdef0123456789abcdef012345",
    "branch": "staging",
    "environment": "staging",
    "pushed_at": "2026-05-18T...",
    "created_at": "2026-05-18T..."
  }
}
```

### 3. Manual GET Endpoint Test

```bash
curl http://localhost:3000/api/version | jq .
```

Expected response (if data exists):
```json
{
  "commit": "380eb2a",
  "commit_full": "380eb2ad0ef0cb1e4fc55b3c4a247b9876811bd5",
  "branch": "staging",
  "environment": "staging",
  "pushed_at": "2026-05-18T10:18:21.331Z"
}
```

Expected response (if no data):
```json
{
  "error": true,
  "statusCode": 404,
  "statusMessage": "No deployment info found. Push a commit first."
}
```

### 4. Full Workflow Test (Git Hook)

```bash
cd /Users/surya/kompas/oasis-dashboard
echo "test deployment $(date)" >> test-version.txt
git add test-version.txt
git commit -m "test: verify version endpoint"
git push
```

Watch for hook output:
```
🚀 [post-push] Hook running...
📝 [post-push] Captured: commit=XXXXXXX branch=staging
📤 [post-push] Sending to http://localhost:3000/api/deployment-info
✅ [post-push] Success! (HTTP 200)
```

Then verify data was saved:
```bash
curl http://localhost:3000/api/version | jq .
```

### 5. Environment Detection Test

**Staging Branch:**
```bash
git checkout staging
git push
curl http://localhost:3000/api/version | jq '.environment'
```
Should return: `"staging"`

**Main Branch:**
```bash
git checkout main
git push
curl http://localhost:3000/api/version | jq '.environment'
```
Should return: `"production"`

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Migration Applied | ✅ PASS | Table created successfully |
| POST /api/deployment-info | ✅ PASS | Saves data correctly |
| GET /api/version | ✅ PASS | Retrieves latest deployment |
| Git Hook Execution | ✅ PASS | Fixed for worktree compatibility |
| Environment Detection | ✅ PASS | staging/main branches detected |
| Database Storage | ✅ PASS | Data persists across requests |

## Known Issues & Fixes

### Issue: Git Hook Failed in Worktree
**Solution:** Added GIT_DIR environment variable and proper path handling to `.git/hooks/post-push`

### Issue: Migration Metadata Missing
**Solution:** Used `drizzle-kit generate` to regenerate with proper metadata

### Issue: Short Commit SHA Not Working
**Solution:** Use manual substring cut since git commands have issues in worktree

## Staging Deployment Checklist

Before deploying to staging server (https://staging-oasis.kgmedia.id/):

- [ ] Commit and push all changes
- [ ] Verify git hook runs locally (HTTP 200)
- [ ] Test `/api/version` endpoint locally
- [ ] Ensure DATABASE_URL env var set on server
- [ ] Run migrations on server: `npm run build && npm run dev` OR use Ansible deployment
- [ ] Verify hook is executable: `chmod +x .git/hooks/post-push`
- [ ] Make test commit and verify hook saves to DB

## Production Deployment Checklist

Before deploying to production (https://oasis.kgmedia.id/):

- [ ] All staging tests passing
- [ ] Commit to `main` branch
- [ ] Ansible deployment completes successfully
- [ ] Test `https://oasis.kgmedia.id/api/version`
- [ ] Verify environment is "production"
- [ ] Monitor database for successful data insertion

## Troubleshooting

### Version endpoint returns 404

**Cause:** No deployment data saved yet
**Fix:** Push a commit to trigger the hook

### Hook doesn't run after push

**Check:**
1. Hook is executable: `ls -la .git/hooks/post-push` (should show `x`)
2. Server is running: `curl http://localhost:3000/api/health`
3. Hook has correct path: `grep SERVER_URL .git/hooks/post-push`

**Fix:**
```bash
chmod +x .git/hooks/post-push
# Then push again
```

### Hook runs but 404 from curl

**Cause:** Server not running or endpoint not available
**Fix:** Start dev server in another terminal: `npm run dev`

### Database error when querying

**Cause:** Migration not applied
**Fix:** Restart dev server (auto-applies migrations on startup)

## API Documentation

### GET /api/version

Returns latest deployment information.

**Response (200):**
```json
{
  "commit": "string",           // Short commit SHA (7 chars)
  "commit_full": "string",      // Full commit SHA
  "branch": "string",           // Git branch name
  "environment": "string",      // "staging" or "production"
  "pushed_at": "ISO8601"        // When data was pushed
}
```

**Response (404):**
```json
{
  "error": true,
  "statusCode": 404,
  "statusMessage": "No deployment info found. Push a commit first."
}
```

### POST /api/deployment-info

Saves deployment information to database. **Called by git hook automatically.**

**Request:**
```json
{
  "commitShaShort": "string",   // 7-char short SHA
  "commitShaFull": "string",    // Full commit SHA
  "branch": "string"            // Git branch name
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "commit_sha_short": "string",
    "commit_sha_full": "string",
    "branch": "string",
    "environment": "string",
    "pushed_at": "ISO8601",
    "created_at": "ISO8601"
  }
}
```

## Files Changed

- `server/database/migrations/0004_young_abomination.sql` — Creates deployment_info table
- `server/database/schema.ts` — Adds deploymentInfo table definition
- `server/api/version.get.ts` — GET endpoint (reads from DB)
- `server/api/deployment-info.post.ts` — POST endpoint (writes to DB)
- `.git/hooks/post-push` — Git hook (calls POST endpoint)
