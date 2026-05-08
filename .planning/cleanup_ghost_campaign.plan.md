# Plan: Cleanup Ghost Campaigns (Lean)

## Summary
Prevent "Ghost Campaigns" (expired but status-active) from being pushed to Cloudflare KV by adding a time-based filter to the dashboard's sync logic and providing a global cleanup utility.

## User Story
As a platform operator, I want only truly active campaigns to be stored in KV, so that the Edge Worker doesn't have to process expired data, reducing latency and state bloat.

## Problem → Solution
Expired campaigns with "active" status persist in KV → Filter by `endDate > NOW()` during the KV push.

## Metadata
- **Complexity**: Small
- **Estimated Files**: 1 (in oasis-dashboard)
- **Target Folder**: `/Users/surya/kompas/oasis-dashboard/server/utils`

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | [kv-sync.ts](file:///Users/surya/kompas/oasis-dashboard/server/utils/kv-sync.ts) | 28-35 | Core query to be modified |

---

## Patterns to Mirror

### DRIZZLE_SQL_FILTER
// SOURCE: server/utils/kv-sync.ts:29-34
```typescript
  const activeCampaigns = await db.select().from(campaigns).where(
    and(
      eq(campaigns.organizationId, organizationId),
      sql`${campaigns.status} IN ('active', 'scheduled')`
    )
  )
```

---

## Proposed Changes

### [oasis-dashboard]

#### [MODIFY] [kv-sync.ts](file:///Users/surya/kompas/oasis-dashboard/server/utils/kv-sync.ts)
- **Modify `syncOrganizationCampaignsToKV`**: Add time-based filter to exclude expired campaigns.
- **New `cleanUpAllGhostCampaigns`**: Utility to re-sync all organizations in the system.

---

## Step-by-Step Tasks

### Task 1: Update syncOrganizationCampaignsToKV
- **ACTION**: Modify the `where` clause in the campaign selection query.
- **IMPLEMENT**:
  ```typescript
  sql`(${campaigns.endDate} IS NULL OR ${campaigns.endDate} > NOW())`
  ```

### Task 2: Create cleanUpAllGhostCampaigns
- **ACTION**: Implement a new exported function in `kv-sync.ts`.
- **IMPLEMENT**: 
  ```typescript
  export async function cleanUpAllGhostCampaigns(): Promise<void> {
    const db = useDB()
    const orgs = await db.select().from(organizations)
    for (const org of orgs) {
      await syncOrganizationCampaignsToKV(org.id)
    }
  }
  ```

---

## Verification Plan

### Manual Verification
1. Set a campaign's `endDate` to the past in the Dashboard.
2. Verify it is REMOVED from the KV array after a sync.
3. Call `cleanUpAllGhostCampaigns` manually (e.g., via a temporary test endpoint) and verify all organizations are synced correctly.
