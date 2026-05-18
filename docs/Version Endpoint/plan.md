# Plan: Add /version Endpoint for Live Staging App

## Context

The staging app at https://staging-oasis.kgmedia.id/ (and production) needs a `/version` endpoint to show which commit is currently deployed. This helps verify deployments and troubleshoot issues.

App runs as **SSR with PM2** + Ansible CI/CD. Git repo is cloned on the server, making database storage more reliable than runtime git queries.

## Goal

Create a `/api/version` endpoint that returns:
- Git commit SHA (short & full)
- Git branch
- Environment (staging or production)
- Deployment timestamp

Endpoint should be:
- Public (no authentication required)
- Read from PostgreSQL database (populated by git hook)
- Auto-capture via post-push git hook

## Approach

### 1. Store in Database (not querying git at request time)
- Create `deployment_info` table
- Git hook sends commit info to DB after each push
- Version endpoint reads from DB (faster, more reliable)

### 2. Git Hook Automation
- `.git/hooks/post-push` runs after every `git push`
- Sends commit metadata to POST endpoint
- Non-blocking (doesn't fail push if API fails)

### 3. Environment Detection via Branch
- `staging` branch → environment is "staging"
- `main` branch → environment is "production"
- Detected in POST endpoint when data is saved

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `server/database/migrations/0004_deployment_info.sql` | **Create** | Migration for deployment_info table |
| `server/database/schema.ts` | **Modify** | Add deploymentInfo table definition |
| `server/api/deployment-info.post.ts` | **Create** | Endpoint to save deployment info (called by hook) |
| `server/api/version.get.ts` | **Modify** | Read latest deployment info from DB |
| `.git/hooks/post-push` | **Create** | Git hook to call POST endpoint after push |

## Implementation Details

### Database Table: `deployment_info`
```sql
CREATE TABLE "deployment_info" (
  "id" uuid PRIMARY KEY,
  "commit_sha_short" varchar(40) NOT NULL,
  "commit_sha_full" varchar(40) NOT NULL,
  "branch" varchar(255) NOT NULL,
  "environment" varchar(50) NOT NULL,
  "pushed_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL
);
CREATE INDEX "deployment_info_pushed_at_idx" on "deployment_info" ("pushed_at" DESC);
```

### API Endpoints

**POST `/api/deployment-info`** (public)
- Called by git hook after push
- Receives commit metadata
- Detects environment from branch name
- Saves to DB
- Returns saved record

**GET `/api/version`** (public)
- Returns latest deployment info
- Response:
  ```json
  {
    "commit": "a7b5c5f",
    "commit_full": "a7b5c5f1234567890abcdef...",
    "branch": "staging",
    "environment": "staging",
    "pushed_at": "2026-05-18T12:00:00.000Z"
  }
  ```

### Git Hook: `.git/hooks/post-push`
- Runs automatically after every `git push`
- Executes locally on developer machines
- Captures: commit SHA (short & full), branch name
- Calls POST endpoint with metadata
- Non-blocking: doesn't fail push if API call fails
- Configurable: uses `SERVER_URL` env var (defaults to http://localhost:3000)

## Workflow

1. Developer: `git push`
2. Git automatically runs `.git/hooks/post-push`
3. Hook captures commit info and calls `POST /api/deployment-info`
4. Server detects environment from branch, saves to DB
5. Developer/user can now access `GET /api/version` to see deployment info

## Verification

**Local Development:**
1. Run migrations: `npm run dev` (auto-runs on startup)
2. Make a test commit and push: `git add . && git commit -m "test" && git push`
3. Hook fires automatically
4. Test endpoint: `curl http://localhost:3000/api/version`
5. Should return latest commit info from DB

**Staging Deployment:**
1. Push to staging branch
2. Ansible deploys automatically
3. Test: `curl https://staging-oasis.kgmedia.id/api/version`
4. Verify it shows deployed commit info

**Production Deployment:**
1. Push to main branch
2. Ansible deploys to production
3. Test: `curl https://oasis.kgmedia.id/api/version`
4. Environment should be "production"

## Notes

- Git hook is local to each developer's machine (in `.git/hooks/`)
- Database stores complete history of deployments
- Each push creates a new record (can query history if needed)
- Hook is non-blocking: push succeeds even if API call fails
- For CI/CD: Ansible can also trigger the POST endpoint during deployment
