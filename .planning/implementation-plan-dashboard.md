# IMPLEMENTATION PLAN: Oasis Dashboard — Campaign Delivery with Cloudflare KV

## Goal
Extend the campaign create flow (`create.vue`) so that when a campaign is saved, it:
1. Persists all edge-worker-required fields to **PostgreSQL** (via Drizzle)
2. Syncs active campaigns to the **Cloudflare KV** namespace `staging-OASIS_DATA` (`id: d92e534787d14a908800f9dd7a9fd765`)

The create flow skips the user-segment selector for now. Instead, two predefined campaign templates are available: **Coupon** and **Feedback Rating**.

---

## PHASE 1: Schema Extension — Add Edge-Worker Fields to `campaigns` Table

### 1A. Update `server/database/schema.ts`

Add the following columns to the `campaigns` table:

| Column | Type | Purpose |
|---|---|---|
| `tenant_id` | `varchar(255)` NOT NULL, default `'kompasid'` | Scopes campaign to a tenant for KV key `tenant:{tenant_id}:campaigns` |
| `template_type` | `varchar(50)` nullable | `'coupon'` \| `'feedback_rating'` |
| `campaign_type` | `varchar(50)` default `'sticky'` | `'sticky'` \| `'in-article'` \| `'popup'` |
| `element_selector` | `text` nullable | CSS selector for `HTMLRewriter.on()` target |
| `html` | `text` nullable | Full banner HTML to inject |
| `trigger` | `jsonb` nullable | `{ mode: 'scroll' \| 'immediate' \| 'exit-intent', value?: number }` |
| `segment` | `varchar(255)` nullable | Audience segment (e.g. `system:anonymous`, `system:logged-in`). Skipped for now — default `null` (show to all). |

### 1B. Create Drizzle Migration

Run `npx drizzle-kit generate` to produce the migration SQL, then `npx drizzle-kit migrate` to apply.

---

## PHASE 2: Predefined Campaign Templates

### 2A. Define Templates in `shared/types/campaign.ts`

Add a `CAMPAIGN_TEMPLATES` constant with the two predefined templates:

```ts
export type TemplateType = 'coupon' | 'feedback_rating'

export const CAMPAIGN_TEMPLATES: Record<TemplateType, {
  label: string
  description: string
  icon: string
  defaults: {
    campaign_type: string
    element_selector: string
    trigger: { mode: string; value?: number }
    html: string
  }
}> = {
  coupon: {
    label: 'Coupon Banner',
    description: 'Display a dismissible coupon/promo banner to drive subscriptions.',
    icon: 'i-lucide-tag',
    defaults: {
      campaign_type: 'sticky',
      element_selector: 'body',
      trigger: { mode: 'scroll', value: 30 },
      html: `<div style="background:#1a56db;color:#fff;padding:12px 24px;text-align:center;font-family:sans-serif;">
  🎁 Get <strong>50% OFF</strong> your first month — Use code <strong>OASIS50</strong>
  <a href="/subscribe" style="margin-left:12px;background:#fff;color:#1a56db;padding:4px 12px;border-radius:4px;text-decoration:none;font-weight:600;">Claim Now</a>
</div>`
    }
  },
  feedback_rating: {
    label: 'Feedback Rating',
    description: 'Ask readers to rate their experience with a star widget.',
    icon: 'i-lucide-star',
    defaults: {
      campaign_type: 'popup',
      element_selector: 'body',
      trigger: { mode: 'scroll', value: 70 },
      html: `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;max-width:320px;box-shadow:0 4px 24px rgba(0,0,0,.1);font-family:sans-serif;">
  <p style="font-weight:600;margin:0 0 8px">How was your reading experience?</p>
  <div style="font-size:28px;letter-spacing:4px">⭐⭐⭐⭐⭐</div>
  <button style="margin-top:12px;width:100%;padding:8px;background:#1a56db;color:#fff;border:none;border-radius:8px;cursor:pointer">Submit</button>
</div>`
    }
  }
}
```

### 2B. Update `createCampaignSchema` in `shared/types/campaign.ts`

```ts
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  objective: z.string().max(255).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  // New edge-worker fields
  tenant_id: z.string().default('kompasid'),
  template_type: z.enum(['coupon', 'feedback_rating']).optional(),
  campaign_type: z.enum(['sticky', 'in-article', 'popup']).default('sticky'),
  element_selector: z.string().optional(),
  html: z.string().optional(),
  trigger: z.object({
    mode: z.enum(['immediate', 'scroll', 'exit-intent']),
    value: z.number().optional()
  }).optional(),
  segment: z.string().optional() // skipped for now
})
```

---

## PHASE 3: Update Create Campaign UI (`app/pages/campaigns/create.vue`)

### Changes:
1. **Remove** user-segment selector (skip entirely)
2. **Add** Template Picker step at the top:
   - 2 cards: **Coupon Banner** and **Feedback Rating**
   - Selecting a card auto-fills `element_selector`, `html`, and `trigger` from `CAMPAIGN_TEMPLATES`
3. **Add** hidden fields that carry the template defaults through to submission
4. **Update** `onSubmit()` to include the template-derived fields in the POST body

### New form shape:
```ts
const form = reactive({
  name: '',
  description: '',
  objective: '',
  priority: 'medium',
  startDate: '',
  endDate: '',
  // New
  template_type: '' as TemplateType | '',
  campaign_type: 'sticky',
  element_selector: '',
  html: '',
  trigger: { mode: 'scroll', value: 30 }
})
```

### Template picker UX:
- Show template cards before the Campaign Details section
- Clicking a template fills `form.template_type`, `form.campaign_type`, `form.element_selector`, `form.html`, `form.trigger`
- Selected card shows a checkmark / highlighted border
- User can still manually edit any pre-filled field in an "Advanced" accordion (optional, defer)

---

## PHASE 4: Update Server API — Persist to Postgres + Sync to KV

### 4A. Update `server/api/campaigns/index.post.ts`

After inserting to Postgres, trigger KV sync:

```ts
import { campaigns } from '../../database/schema'
import { createCampaignSchema } from '~~/shared/types/campaign'
import { syncTenantCampaignsToKV } from '../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [campaign] = await db.insert(campaigns).values({
    name: parsed.data.name,
    description: parsed.data.description || null,
    objective: parsed.data.objective || null,
    priority: parsed.data.priority,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    tenant_id: parsed.data.tenant_id,
    template_type: parsed.data.template_type || null,
    campaign_type: parsed.data.campaign_type,
    element_selector: parsed.data.element_selector || null,
    html: parsed.data.html || null,
    trigger: parsed.data.trigger || null,
    segment: parsed.data.segment || null
  }).returning()

  setResponseStatus(event, 201)

  // Sync to KV after creation (non-blocking for draft, blocking for active)
  // Only sync when status is active — drafts are not pushed.
  // (Synced on status transition to 'active' via status.patch.ts)

  return campaign
})
```

### 4B. Create `server/utils/kv-sync.ts`

This utility calls the **Cloudflare REST API** to write to the KV namespace:

```ts
/**
 * Syncs all ACTIVE campaigns for a given tenant to Cloudflare KV.
 * KV Key: tenant:{tenant_id}:campaigns
 * Namespace: staging-OASIS_DATA (id: d92e534787d14a908800f9dd7a9fd765)
 */
export async function syncTenantCampaignsToKV(tenantId: string) {
  const config = useRuntimeConfig()
  const db = useDB()

  // 1. Fetch all active campaigns for tenant from Postgres
  const activeCampaigns = await db.query.campaigns.findMany({
    where: (c, { and, eq }) => and(eq(c.tenant_id, tenantId), eq(c.status, 'active'))
  })

  // 2. Map to KV format (oasis-edge Campaign type)
  const kvPayload = activeCampaigns.map(c => ({
    id: c.id,
    type: c.campaign_type || 'sticky',
    trigger: c.trigger || { mode: 'immediate' },
    segment: c.segment || null,   // null = show to everyone
    element_selector: c.element_selector || 'body',
    html: c.html || ''
  }))

  // 3. Write to Cloudflare KV via REST API
  const accountId = config.cloudflareAccountId
  const namespaceId = config.cloudflareKvNamespaceId  // d92e534787d14a908800f9dd7a9fd765
  const apiToken = config.cloudflareApiToken
  const kvKey = `tenant:${tenantId}:campaigns`

  const res = await $fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(kvPayload)
    }
  )

  return res
}
```

### 4C. Fix `server/api/campaigns/[id].put.ts`

Replace dead `syncCampaignToRedis(id)` call with `syncTenantCampaignsToKV(tenant_id)`.

### 4D. Update `server/api/campaigns/[id]/status.patch.ts`

Call `syncTenantCampaignsToKV()` whenever a campaign transitions **to** or **from** `active` status (adds or removes it from the KV list).

---

## PHASE 5: Nuxt Runtime Config — Cloudflare Credentials

### 5A. Update `nuxt.config.ts`

```ts
runtimeConfig: {
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  cloudflareKvNamespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
  // existing keys...
}
```

### 5B. Update `.env` / `.env.example`

```env
CLOUDFLARE_ACCOUNT_ID=<your account id>
CLOUDFLARE_API_TOKEN=<your api token with KV write permission>
CLOUDFLARE_KV_NAMESPACE_ID=d92e534787d14a908800f9dd7a9fd765
```

---

## PHASE 6: Edge Worker Gaps (Fix in `oasis-edge`)

> These complement the dashboard changes. See `implementation-plan-edge.md` for full context.

| Gap | Fix |
|---|---|
| `syncCampaignToRedis` dead call | Replace with KV sync via REST |
| Missing `user` tracker data in `__OASIS_DATA__` payload | Build `TrackerData` from `request.cf` and inject alongside campaigns |
| Test-mode cookie gate locking campaigns | Add `is_live: boolean` to `TenantConfig`, remove cookie gate for live tenants |
| `segment: null` campaigns not shown to all | Fix filter logic: `campaign.segment === null` means show to everyone |

---

## KV Key Reference

| Key | Written by | Read by |
|---|---|---|
| `tenant:{hostname}:config` | Manual / admin | `oasis-edge` |
| `tenant:{tenant_id}:campaigns` | **`oasis-proto` kv-sync util** | `oasis-edge` |
| `user:{tenant_id}:{guid}:segments` | `oasis-proto` ingest API | `oasis-edge` |
| `user:{tenant_id}:{guid}:state` | `oasis-script` beacon | `oasis-edge` |

**Target KV Namespace:** `staging-OASIS_DATA` → id `d92e534787d14a908800f9dd7a9fd765`

---

## Verification Plan

1. Create a campaign using the **Coupon** template → Save as Draft → no KV write expected
2. Transition campaign to **Active** → confirm `tenant:kompas:campaigns` in KV contains the campaign
3. Open `oasis-edge` local dev (`npx wrangler dev`) with `oasis_test=1` cookie → confirm banner injected into proxied page
4. Dismiss banner → confirm `oasis-script` sends beacon → `user:kompas:{guid}:state` updated
5. Reload page → confirm dismissed campaign is not injected again

---

## Files Changed Summary

### `oasis-proto` (Dashboard)

| File | Action |
|---|---|
| `server/database/schema.ts` | Add 7 columns to `campaigns` table |
| `shared/types/campaign.ts` | Add `CAMPAIGN_TEMPLATES`, update `createCampaignSchema` |
| `server/api/campaigns/index.post.ts` | Persist new fields to Postgres |
| `server/api/campaigns/[id]/status.patch.ts` | Trigger KV sync on `active` transition |
| `server/api/campaigns/[id].put.ts` | Fix dead `syncCampaignToRedis` call |
| `server/utils/kv-sync.ts` | **[NEW]** Cloudflare KV REST sync utility |
| `nuxt.config.ts` | Add Cloudflare runtime config keys |
| `.env` / `.env.example` | Add `CLOUDFLARE_*` env vars |
| `app/pages/campaigns/create.vue` | Remove segment picker, add template picker |

### `oasis-edge` (Worker)

| File | Action |
|---|---|
| `src/index.ts` | Fix `segment: null` filter, inject `user` tracker data |
| `src/types.ts` | Add `is_live` to `TenantConfig`, `segment` nullable |
| `KV-management.md` | Document `is_live` flag |

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Should campaigns with `segment: null` be shown to ALL users (anonymous + logged-in), or only `system:anonymous`? Current plan: `null` = all users.

> [!IMPORTANT]
> **Q2**: The `tenant_id` is hardcoded to `'kompasid'` for now. When multi-tenant is needed, a `tenants` table and a tenant selector in the UI will be required.

> [!WARNING]
> **Q3**: The Cloudflare API token needs KV Write permission for namespace `d92e534787d14a908800f9dd7a9fd765`. Confirm it's scoped correctly before testing.
