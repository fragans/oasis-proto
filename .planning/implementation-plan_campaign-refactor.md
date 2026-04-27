# Plan: OSM Campaign Create — Wizard Refactor (Full E2E)

## Context

Current OSM campaign create lives in a single scrollable form at [app/pages/campaigns/on-site-messages/create.vue](/Users/surya/kompas/oasis-proto/app/pages/campaigns/on-site-messages/create.vue) with collapsible sections (template + details + delivery + creatives). Targeting is limited to a single `segment` string. We want a guided multi-step wizard so users compose richer campaigns (predefined templates, creative gallery, multi-rule targeting, explicit goal, duration) and we want the new targeting rules (geolocation, device-type, login-state, page-url, gtm-attr) honored end-to-end in `oasis-edge`.

Outcome:
1. "Create OSM Campaign" → name modal → draft row in Postgres → nested wizard routes `/campaigns/on-site-messages/[id]/wizard/*`.
2. New schema columns `targeting` and `goal` (jsonb) persist wizard state per step.
3. KV payload extended with `targeting` + `goal`; edge worker evaluates server-side predicates in `filterCampaigns`, streams client-side predicates (gtm-attr) to trigger engine; goal click beacon wired into injected HTML.
4. Creative gallery page + picker modal, reused in template step.

## User Story

As a campaign manager, I want a guided multi-step wizard for on-site messages with predefined templates, multi-rule targeting, explicit triggers, goals, and duration, so I can author intentional campaigns without editing raw HTML.

## Problem → Solution

Single page with everything jammed together + no targeting beyond one segment + no goal tracking
→ 6-step wizard with persistent draft + rich targeting evaluated in edge + goal beacon.

## Metadata

- **Complexity**: Large
- **Source PRD**: N/A (free-form)
- **Estimated Files**: ~25 new, ~8 modified

---

## UX Design

### Before

```
/campaigns/on-site-messages/create
┌────────────────────────────────────────┐
│  New Message                           │
│  [Template picker tiles]               │
│  [Name, Desc, Objective, Priority]     │
│  [Element selector, Trigger, HTML]     │
│  [Creative uploader]                   │
│  [Save Draft]     [Schedule]           │
└────────────────────────────────────────┘
```

### After

```
/campaigns/on-site-messages  → click "Create OSM Campaign"
┌── Modal ─────────────────────────┐
│  Campaign name:  [________]      │
│  [Cancel]      [Next →]          │
└──────────────────────────────────┘
  POST /api/campaigns { name, status: 'draft' }
  router.push(`/.../${id}/wizard/template`)

/campaigns/on-site-messages/[id]/wizard/template
┌─── Stepper: ● Template · ○ Target · ○ Trigger · ○ Goal · ○ Launch ──┐
│                                                                     │
│  Pick a predefined template                                         │
│  ┌─── modal-with-cta-redirect ───┐                                  │
│  │ Tile preview. Background = creative picker.                      │
│  └───────────────────────────────┘                                  │
│                [Back]           [Next →]                            │
└─────────────────────────────────────────────────────────────────────┘

.../wizard/target   → Add rule dropdown + rule editors (geo/device/login/page/gtm)
.../wizard/trigger  → radio: immediate | scroll(+%) | exit-intent
.../wizard/goal     → goal type = click (select selector, redirect URL)
.../wizard/launch   → start/end datetime + "Save Draft" button

/creatives  → gallery grid (new standalone page)
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Entry to create | Link → single page | Button → name modal → wizard | Draft row created immediately |
| Template | Inline tile in same form | Own step page | Template defines default html + campaignType + elementSelector |
| Background image | Not wired | Pick creative from gallery | Updates `form.html` with creative url |
| Targeting | Single `segment` text input | Multi-rule editor (5 rule types) | Persists as `targeting` jsonb |
| Goal | Missing | Own step (click goal) | Persists as `goal` jsonb |
| Duration | Free-flowing datetime inputs in details | Dedicated Launch step | Saves `startDate`/`endDate`, status stays `draft` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | [shared/types/campaign.ts](/Users/surya/kompas/oasis-proto/shared/types/campaign.ts) | 1-209 | Type contract + Zod schemas + KVCampaign shape |
| P0 | [server/database/schema.ts](/Users/surya/kompas/oasis-proto/server/database/schema.ts) | 1-100 | Campaigns/creatives/tenants tables |
| P0 | [server/utils/kv-sync.ts](/Users/surya/kompas/oasis-proto/server/utils/kv-sync.ts) | 1-175 | Postgres→KV mapping |
| P0 | [oasis-edge/src/types.ts](/Users/surya/kompas/oasis-edge/src/types.ts) | 1-61 | Edge Campaign + TrackerData types |
| P0 | [oasis-edge/src/core/personalization.ts](/Users/surya/kompas/oasis-edge/src/core/personalization.ts) | 1-96 | filterCampaigns + segment resolution |
| P0 | [oasis-edge/src/core/rewriter.ts](/Users/surya/kompas/oasis-edge/src/core/rewriter.ts) | 1-92 | HTML injection + trigger engine |
| P0 | [oasis-edge/src/index.ts](/Users/surya/kompas/oasis-edge/src/index.ts) | 1-93 | Request pipeline |
| P1 | [app/pages/campaigns/on-site-messages/create.vue](/Users/surya/kompas/oasis-proto/app/pages/campaigns/on-site-messages/create.vue) | 1-425 | Existing create flow to replace |
| P1 | [app/components/journey/JourneyCreateModal.vue](/Users/surya/kompas/oasis-proto/app/components/journey/JourneyCreateModal.vue) | 1-127 | Modal pattern to mirror |
| P1 | [server/api/campaigns/index.post.ts](/Users/surya/kompas/oasis-proto/server/api/campaigns/index.post.ts) | 1-40 | Create draft pattern |
| P1 | [server/api/campaigns/[id].put.ts](/Users/surya/kompas/oasis-proto/server/api/campaigns/[id].put.ts) | 1-58 | Per-step PATCH pattern |
| P1 | [app/components/campaign/CreativeUploader.vue](/Users/surya/kompas/oasis-proto/app/components/campaign/CreativeUploader.vue) | all | Reuse in gallery |
| P2 | Existing Drizzle migrations `server/database/migrations/0004_add_campaign_edge_fields.sql` | all | Migration style |

---

## Patterns to Mirror

### MODAL_PATTERN (Nuxt UI UModal + v-model:open)
```ts
// SOURCE: app/components/journey/JourneyCreateModal.vue:2-8
const emit = defineEmits<{ created: [journey: { id: string }] }>()
const open = defineModel<boolean>('open', { default: false })
```
```vue
<!-- SOURCE: app/components/journey/JourneyCreateModal.vue:47 -->
<UModal v-model:open="open">
  <template #header>...</template>
  <template #body>...</template>
  <template #footer>...</template>
</UModal>
```

### ZOD_SCHEMA (colocate in shared/types)
```ts
// SOURCE: shared/types/campaign.ts:148-166
export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  priority: z.enum(['low','medium','high','critical']).default('medium'),
  ...
})
export const updateCampaignSchema = createCampaignSchema.partial()
```

### API_CREATE_HANDLER (validate → insert → return)
```ts
// SOURCE: server/api/campaigns/index.post.ts:4-38
export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, ... })
  const [campaign] = await db.insert(campaigns).values({ ... }).returning()
  setResponseStatus(event, 201)
  return campaign
})
```

### API_PATCH_HANDLER (partial update + KV resync if active)
```ts
// SOURCE: server/api/campaigns/[id].put.ts:28-54
const updateData: Record<string, unknown> = { updatedAt: new Date() }
if (parsed.data.trigger !== undefined) updateData.trigger = parsed.data.trigger
// ... per-field gate
const [updated] = await db.update(campaigns).set(updateData).where(eq(campaigns.id, id)).returning()
if (updated.status === 'active') await syncTenantCampaignsToKV(tenantId)
```

### PAGE_SETUP (layout + composable + toast)
```ts
// SOURCE: app/pages/campaigns/on-site-messages/create.vue:5-9
definePageMeta({ layout: 'default' })
const router = useRouter()
const { createCampaign } = useCampaign()
const toast = useToast()
```

### KV_MAPPER (Postgres → KVCampaign)
```ts
// SOURCE: server/utils/kv-sync.ts:35-43
const kvPayload: KVCampaign[] = activeCampaigns.map(c => ({
  id: c.id,
  type: (c.campaignType || 'sticky') as CampaignType,
  trigger: (c.trigger as CampaignTrigger | null) || { mode: 'immediate' },
  segment: c.segment ?? null,
  element_selector: c.elementSelector || 'body',
  html: c.html || '',
  isTestMode: c.isTestMode
}))
```

### EDGE_FILTER (campaign predicate)
```ts
// SOURCE: oasis-edge/src/core/personalization.ts:60-72
return campaigns.filter((campaign) => {
  if (campaign.isTestMode && !isTestCookiePresent) return false
  const segment = (campaign as any).segment ?? null
  const matchesSegment = segment === null || segments.includes(segment)
  const notDismissed = !dismissedIds.includes(campaign.id)
  return matchesSegment && notDismissed
})
```

### TRIGGER_ENGINE (client-side gate)
```ts
// SOURCE: oasis-edge/src/core/rewriter.ts:62-92
// IIFE in <script>, reads window.__OASIS_DATA__, attaches scroll/mouseleave listeners.
// Extend here for gtm-attr predicate + goal click beacon.
```

### TILE_PICKER_BUTTON
```vue
<!-- SOURCE: app/pages/campaigns/on-site-messages/create.vue:150-180 -->
<button type="button" class="relative text-left border rounded-xl p-4 ..."
  :class="selected ? 'border-primary-500 ring-2 ring-primary-500' : 'border-zinc-200 hover:border-zinc-400'"
  @click="select(key)">
  <UIcon :name="icon" class="w-5 h-5" />
  <p class="font-medium text-sm">...</p>
</button>
```

---

## Files to Change

### oasis-proto (dashboard)

| File | Action | Justification |
|---|---|---|
| `server/database/schema.ts` | UPDATE | Add `targeting jsonb`, `goal jsonb` columns to `campaigns`; reuse `creatives` |
| `server/database/migrations/0007_add_targeting_and_goal.sql` | CREATE | Drizzle migration for new columns |
| `shared/types/campaign.ts` | UPDATE | Add `TargetingRule`, `Targeting`, `CampaignGoal` types, `TemplateType` extension (`modal-with-cta-redirect`), extend Zod `createCampaignSchema`/`updateCampaignSchema`, extend `KVCampaign` |
| `server/api/campaigns/index.post.ts` | UPDATE | Accept `targeting` + `goal` in insert |
| `server/api/campaigns/[id].put.ts` | UPDATE | Accept `targeting` + `goal` in update |
| `server/utils/kv-sync.ts` | UPDATE | Include `targeting`, `goal` in KV payload mapping |
| `server/api/creatives/index.get.ts` | CREATE | Tenant-scoped list of all creatives across campaigns |
| `app/pages/campaigns/on-site-messages/index.vue` | UPDATE | Replace NuxtLink-to-create with button that toggles OsmCreateNameModal |
| `app/components/campaign/OsmCreateNameModal.vue` | CREATE | Name-only modal; creates draft → routes to wizard step 1 |
| `app/layouts/wizard.vue` | CREATE | Shared wizard shell: back, progress stepper, save & continue |
| `app/components/campaign/wizard/WizardStepper.vue` | CREATE | Top stepper reading current route |
| `app/components/campaign/wizard/WizardFooter.vue` | CREATE | Back / Save & Continue / Skip buttons |
| `app/pages/campaigns/on-site-messages/[id]/wizard/template.vue` | CREATE | Step 1 — predefined template tiles + creative picker for background |
| `app/pages/campaigns/on-site-messages/[id]/wizard/target.vue` | CREATE | Step 2 — multi-rule targeting editor |
| `app/pages/campaigns/on-site-messages/[id]/wizard/trigger.vue` | CREATE | Step 3 — one of immediate / scroll / exit-intent |
| `app/pages/campaigns/on-site-messages/[id]/wizard/goal.vue` | CREATE | Step 4 — goal type = click, element selector + destination |
| `app/pages/campaigns/on-site-messages/[id]/wizard/launch.vue` | CREATE | Step 5 — duration (start/end) + Save Draft |
| `app/components/campaign/wizard/TemplateTile.vue` | CREATE | Template preview tile |
| `app/components/campaign/wizard/TargetingRuleEditor.vue` | CREATE | Router component per rule type |
| `app/components/campaign/wizard/rules/GeoRule.vue` | CREATE | Country/city/region inputs |
| `app/components/campaign/wizard/rules/DeviceRule.vue` | CREATE | Device type checkboxes (mobile/desktop/tablet) |
| `app/components/campaign/wizard/rules/LoginStateRule.vue` | CREATE | logged-in / anonymous |
| `app/components/campaign/wizard/rules/PageRule.vue` | CREATE | URL pattern list (equals / starts-with / regex) |
| `app/components/campaign/wizard/rules/GtmAttrRule.vue` | CREATE | dataLayer key + equals/contains value |
| `app/pages/creatives/index.vue` | CREATE | Creative gallery page |
| `app/components/creative/CreativePickerModal.vue` | CREATE | Modal grid of creatives for template background |
| `app/composables/useWizardDraft.ts` | CREATE | Fetch campaign by id + autosave helper (debounced PATCH) |
| `shared/lib/targeting.ts` | CREATE | Shared predicate eval stubs + type guards (used in edge too via copy) |
| `app/pages/campaigns/on-site-messages/create.vue` | DELETE | Replaced by wizard |

### oasis-edge (worker)

| File | Action | Justification |
|---|---|---|
| `src/types.ts` | UPDATE | Extend `Campaign` with `targeting?: Targeting`, `goal?: CampaignGoal`; add `Targeting`, `TargetingRule`, `CampaignGoal` types |
| `src/core/personalization.ts` | UPDATE | Add `matchesTargeting()` server-side (geo/device/login/page). Pass-through `gtm-attr` rules to client. |
| `src/core/rewriter.ts` | UPDATE | Inject `targeting.client` rules into `window.__OASIS_DATA__`; trigger engine evaluates `gtm-attr` before show; inject goal click beacon (`fetch` to `api_url + /ingest/engagement` with `event: 'goal.click'`) |
| `src/core/targeting.ts` | CREATE | `matchesGeo`, `matchesDevice` (ua-parser), `matchesLogin`, `matchesPage` predicates |

## NOT Building

- Edge-side analytics for targeting hit/miss (just binary filter).
- Multi-goal campaigns — one click goal per campaign.
- Percentage/weighted traffic splitting.
- Campaign preview iframe.
- Undo/version history for drafts.
- `modal-with-cta-redirect` rich WYSIWYG — ship with pre-rendered HTML populated from template + selected creative URL; no visual editor.
- Tagging, search on creative gallery (list only).
- Migrating existing single-page drafts to wizard state — existing drafts stay editable via current list→detail route, but new creates go through wizard.
- Goal types other than `click` (no `view`, `dismiss`, `form_submit`).

---

## Step-by-Step Tasks

### Task 1: Extend shared types & Zod schemas
- **ACTION**: Add targeting + goal types to shared/types/campaign.ts
- **IMPLEMENT**:
  ```ts
  export type DeviceType = 'mobile' | 'desktop' | 'tablet'
  export type TargetingRule =
    | { kind: 'geo'; countries?: string[]; cities?: string[]; regions?: string[]; boundingBox?: { latMin: number; latMax: number; lonMin: number; lonMax: number } }
    | { kind: 'device'; types: DeviceType[] }
    | { kind: 'login'; state: 'logged-in' | 'anonymous' }
    | { kind: 'page'; match: 'equals' | 'starts-with' | 'regex'; value: string }
    | { kind: 'gtm-attr'; key: string; op: 'equals' | 'contains'; value: string }

  export interface Targeting { operator: 'AND' | 'OR'; rules: TargetingRule[] }
  export interface CampaignGoal { type: 'click'; selector: string; destinationUrl?: string }

  // extend TemplateType
  export type TemplateType = 'coupon' | 'feedback_rating' | 'modal-with-cta-redirect'

  // extend CAMPAIGN_TEMPLATES with modal-with-cta-redirect entry supporting a creative placeholder `{{creativeUrl}}`

  // extend Campaign interface with `targeting: Targeting | null; goal: CampaignGoal | null`
  // extend KVCampaign with `targeting: Targeting | null; goal: CampaignGoal | null`
  // extend createCampaignSchema with targeting/goal zod objects (optional)
  ```
- **MIRROR**: ZOD_SCHEMA
- **IMPORTS**: `z` from `zod`
- **GOTCHA**: `TemplateType` string-literal drift — update all switch/exhaustive usages. Grep `TemplateType` before merging.
- **VALIDATE**: `pnpm tsc --noEmit`

### Task 2: Drizzle migration + schema update
- **ACTION**: Add `targeting` + `goal` jsonb columns to `campaigns` table
- **IMPLEMENT**: In `server/database/schema.ts` add
  ```ts
  targeting: jsonb('targeting').$type<import('~~/shared/types/campaign').Targeting | null>(),
  goal: jsonb('goal').$type<import('~~/shared/types/campaign').CampaignGoal | null>(),
  ```
  Generate migration via `pnpm drizzle-kit generate` → produces `0007_*.sql` with `ALTER TABLE campaigns ADD COLUMN targeting jsonb; ADD COLUMN goal jsonb;`
- **MIRROR**: existing `trigger: jsonb('trigger').$type<...>()` at schema.ts:59
- **GOTCHA**: Existing migrations had idempotent wrapping (commit `1bcd9ad`) — apply same `DO $$ ... IF NOT EXISTS` pattern to the generated SQL.
- **VALIDATE**: `pnpm drizzle-kit migrate` on local Postgres; verify columns exist via `\d campaigns`.

### Task 3: Update create/update API + KV sync
- **ACTION**: Accept `targeting` + `goal` through API and propagate to KV
- **IMPLEMENT**:
  - `server/api/campaigns/index.post.ts`: add `targeting: parsed.data.targeting ?? null, goal: parsed.data.goal ?? null` to insert values
  - `server/api/campaigns/[id].put.ts`: add per-field gates for both
  - `server/utils/kv-sync.ts` line 35-43: add `targeting: c.targeting ?? null, goal: c.goal ?? null` to `kvPayload`
- **MIRROR**: API_CREATE_HANDLER, API_PATCH_HANDLER, KV_MAPPER
- **GOTCHA**: `updateCampaignSchema = createCampaignSchema.partial()` picks up new fields automatically — verify.
- **VALIDATE**: `curl -X POST /api/campaigns -d '{"name":"t","targeting":{"operator":"AND","rules":[]}}'` returns 201.

### Task 4: Create OsmCreateNameModal + wire list page button
- **ACTION**: Add modal that creates draft then navigates to wizard
- **IMPLEMENT**:
  - Clone [JourneyCreateModal.vue](/Users/surya/kompas/oasis-proto/app/components/journey/JourneyCreateModal.vue) pattern
  - Submit calls `createCampaign({ name, tenantId: 'kompasid', campaignType: 'popup', templateType: 'modal-with-cta-redirect' })` → `router.push(\`/campaigns/on-site-messages/${id}/wizard/template\`)`
  - Update `app/pages/campaigns/on-site-messages/index.vue`: replace create link with `<UButton @click="openModal = true">Create OSM Campaign</UButton>`
- **MIRROR**: MODAL_PATTERN, PAGE_SETUP
- **IMPORTS**: `useCampaign`, `useRouter`, `useToast`
- **GOTCHA**: Name must trim non-empty — `:disabled="!form.name.trim()"`.
- **VALIDATE**: Open list, click button, fill name, submit → DB row appears with `status='draft'`; browser navigates to `.../wizard/template`.

### Task 5: Wizard layout + stepper + footer
- **ACTION**: Shared UI for all 5 steps
- **IMPLEMENT**:
  - `app/layouts/wizard.vue` — header with campaign name (fetched via `useWizardDraft`), `<WizardStepper />`, `<slot />`, `<WizardFooter />`
  - Steps array `[template, target, trigger, goal, launch]`; compute current from `route.path`
  - `WizardFooter` emits `back` / `next`. Next calls `saveAndContinue` provided by each step page.
- **MIRROR**: existing `definePageMeta({ layout: 'default' })` usage
- **GOTCHA**: Guard route: if `campaignId` not found in DB, redirect to list.
- **VALIDATE**: Visit `/campaigns/on-site-messages/{id}/wizard/template` → stepper highlights Template; back button goes to list.

### Task 6: `useWizardDraft` composable
- **ACTION**: Shared fetch + autosave state
- **IMPLEMENT**:
  ```ts
  export function useWizardDraft(campaignId: string) {
    const { data, refresh } = useFetch(`/api/campaigns/${campaignId}`)
    async function patch(partial: Partial<UpdateCampaignInput>) {
      return $fetch(`/api/campaigns/${campaignId}`, { method: 'PUT', body: partial })
    }
    return { campaign: data, refresh, patch }
  }
  ```
- **MIRROR**: existing `useCampaign` composable
- **GOTCHA**: `useFetch` SSR; refresh after each step PATCH to keep `data` in sync.
- **VALIDATE**: In any step, call `patch({ ... })`, refresh, re-fetch shows new values.

### Task 7: Step 1 — Template page
- **ACTION**: Predefined templates + creative background picker
- **IMPLEMENT**:
  - Tile grid using TILE_PICKER_BUTTON pattern; seed from `CAMPAIGN_TEMPLATES`
  - For `modal-with-cta-redirect`: "Background creative" button opens `CreativePickerModal`; on select, replace `{{creativeUrl}}` in tpl.defaults.html
  - On Next → `patch({ templateType, campaignType, elementSelector, html })`
- **MIRROR**: TILE_PICKER_BUTTON
- **GOTCHA**: HTML for modal-with-cta-redirect must expose Dismiss/Close/Redirect buttons with `data-oasis-goal="click"` so goal beacon wires correctly.
- **VALIDATE**: Pick template, pick creative, Next → DB row shows html with chosen URL.

### Task 8: Step 2 — Target page
- **ACTION**: Multi-rule editor
- **IMPLEMENT**:
  - State `rules: TargetingRule[] = campaign.targeting?.rules ?? []`; operator select (AND/OR)
  - "+ Add rule" dropdown: geo / device / login / page / gtm-attr
  - Each rule renders via `<TargetingRuleEditor :rule="..." @update="..." @remove="..." />` which dispatches to the five `rules/*.vue` components
  - On Next → `patch({ targeting: { operator, rules } })`
- **MIRROR**: PAGE_SETUP
- **GOTCHA**: Empty rules array == show to everyone (same semantics as `segment: null`).
- **VALIDATE**: Add one geo rule `countries: ['ID']`, Next → DB `targeting` jsonb matches.

### Task 9: Step 3 — Trigger page
- **ACTION**: Radio select immediate / scroll / exit-intent
- **IMPLEMENT**: USelect or radio-tiles (mirror JourneyCreateModal trigger grid); when `scroll`, show `value` (%) input.
- **MIRROR**: existing trigger UI at create.vue:292-319
- **GOTCHA**: `value` required + 1-100 when mode=scroll; zod refine.
- **VALIDATE**: Pick scroll=40, Next → DB `trigger = {mode:'scroll',value:40}`.

### Task 10: Step 4 — Goal page
- **ACTION**: Define click goal
- **IMPLEMENT**:
  - Goal type (for now fixed = `click`), selector input, destination URL input
  - `patch({ goal: { type:'click', selector, destinationUrl } })`
- **MIRROR**: UFormField + UInput pattern
- **GOTCHA**: If destinationUrl present, goal click also navigates; otherwise it just fires beacon.
- **VALIDATE**: Enter `.oasis-cta`, `https://kompas.id/subscribe`, Next → DB `goal` populated.

### Task 11: Step 5 — Launch page
- **ACTION**: Duration + Save Draft
- **IMPLEMENT**:
  - Two datetime-local inputs bound to `startDate`/`endDate`
  - Button "Save as Draft" → `patch({ startDate, endDate })` → redirect `/campaigns/on-site-messages/[id]`
  - Zod: endDate >= startDate; both optional
- **MIRROR**: existing date handling at create.vue:66-67 (`new Date(...).toISOString()`)
- **GOTCHA**: Save leaves status=`draft`; activation happens on detail page. Don't flip to `scheduled` automatically.
- **VALIDATE**: Submit, detail page loads with draft populated.

### Task 12: Creative gallery page + picker modal
- **ACTION**: List all creatives across campaigns for a tenant
- **IMPLEMENT**:
  - `server/api/creatives/index.get.ts`:
    ```ts
    const rows = await db.select({ ...creatives, campaignId: creatives.campaignId })
      .from(creatives)
      .innerJoin(campaigns, eq(creatives.campaignId, campaigns.id))
      .where(eq(campaigns.tenantId, tenantId))
      .orderBy(desc(creatives.createdAt))
    return { creatives: rows }
    ```
    Tenant from query `?tenantId=${runtimeConfig().public.defaultTenantId}`
  - `app/pages/creatives/index.vue`: grid of `<img>` thumbnails using existing `CreativePreview.vue`
  - `app/components/creative/CreativePickerModal.vue`: same grid, emits `select(creative)` on click
- **MIRROR**: API_CREATE_HANDLER skeleton; CreativeUploader.vue / CreativePreview.vue
- **GOTCHA**: Creatives are campaign-scoped in schema; no cross-campaign reuse today — gallery is a read-only view, actual `creatives` row still attaches to a specific campaign. When picked in Template step we just copy the `fileUrl` into the template HTML; no DB link.
- **VALIDATE**: Upload a creative to any campaign, `/creatives` lists it.

### Task 13: Edge types + targeting predicates
- **ACTION**: Mirror shared/types into edge and implement predicates
- **IMPLEMENT**:
  - `oasis-edge/src/types.ts`: copy `TargetingRule`, `Targeting`, `CampaignGoal`; extend `Campaign` interface to include `targeting?: Targeting | null; goal?: CampaignGoal | null`
  - `oasis-edge/src/core/targeting.ts` (new):
    ```ts
    import type { TargetingRule, Campaign } from '../types'

    export function matchesGeo(rule, geo) { /* country/city/region/boundingBox */ }
    export function matchesDevice(rule, ua) { /* ua regex for mobile/tablet/desktop */ }
    export function matchesLogin(rule, isLoggedIn) { return rule.state === 'logged-in' ? isLoggedIn : !isLoggedIn }
    export function matchesPage(rule, pathname) { /* equals/starts-with/regex */ }
    export function partitionTargeting(campaign: Campaign) {
      const all = campaign.targeting?.rules ?? []
      return { server: all.filter(r => r.kind !== 'gtm-attr'), client: all.filter(r => r.kind === 'gtm-attr') }
    }
    ```
- **MIRROR**: EDGE_FILTER structure
- **GOTCHA**: Keep regex capped (e.g. max 512 chars, try/catch) to avoid ReDoS from user input.
- **VALIDATE**: Unit tests for each predicate (vitest, mirror existing tests if present).

### Task 14: Edge — extend filterCampaigns with targeting
- **ACTION**: Add server-side targeting gate after existing segment/dismiss filter
- **IMPLEMENT**: In `personalization.ts` change `filterCampaigns` signature to take `{ url, trackerData, isLoggedIn }` and evaluate `partitionTargeting(campaign).server` with `operator` AND/OR. Campaigns with no targeting still pass.
- **MIRROR**: EDGE_FILTER
- **GOTCHA**: `filterCampaigns` is pure currently — keep it pure. Pass `isLoggedIn` already computed in `resolveSegments` out via returned tuple (small refactor).
- **VALIDATE**: Manual trace — campaign with `{rules:[{kind:'geo', countries:['ID']}]}` shown only when `cf.country === 'ID'`.

### Task 15: Edge — client-side payload for gtm-attr + goal beacon
- **ACTION**: Ship remaining rules to browser, wire click goal beacon
- **IMPLEMENT**:
  - In `rewriter.ts` `campaignPayload` push `{ id, trigger, targetingClient: partitionTargeting(c).client, goal: c.goal, trackerUrl }`
  - Extend trigger engine (`getTriggerEngineScript`) to:
    1. Skip campaign if `targetingClient` rules don't match `window.dataLayer` (walk dataLayer, compare key → equals/contains)
    2. After show, if `c.goal?.type === 'click'`, `querySelectorAll(c.goal.selector)` within the campaign shadowRoot (`document.getElementById('oasis-campaign-'+id).shadowRoot`) and attach click listener that `navigator.sendBeacon(trackerUrl, JSON.stringify({ event:'goal.click', campaignId:id }))` then `window.location.href = c.goal.destinationUrl` if set
- **MIRROR**: TRIGGER_ENGINE
- **GOTCHA**: Shadow DOM — `getElementById` returns the host, must use `.shadowRoot.querySelectorAll`. Click handler lives inside shadow, so goal selector is relative to shadow content, not document.
- **GOTCHA**: `sendBeacon` is fire-and-forget; no backend ingest handler change needed if `api_url + /ingest/engagement` already accepts arbitrary JSON. Confirm before wiring or add TODO.
- **VALIDATE**: Load page with gtm test: `window.dataLayer = [{ userTier: 'premium' }]` + rule `{kind:'gtm-attr', key:'userTier', op:'equals', value:'premium'}` → banner shows; change to `free` → banner hidden. Click CTA → network tab shows beacon.

### Task 16: Delete legacy create.vue + tests
- **ACTION**: Remove deprecated page
- **IMPLEMENT**: `git rm app/pages/campaigns/on-site-messages/create.vue`; grep for `/on-site-messages/create` route references, replace with modal trigger.
- **GOTCHA**: Keep detail/edit page working — wizard PATCHes same endpoint; detail-page editing unchanged.
- **VALIDATE**: `pnpm build` green.

### Task 17: Tests
- **ACTION**: Unit + E2E
- **IMPLEMENT**:
  - Unit (vitest): targeting predicates in `oasis-edge/src/core/targeting.test.ts`; zod schema in `shared/types/campaign.test.ts`.
  - Playwright: create campaign end-to-end (modal → 5 steps → detail shows draft).
- **MIRROR**: existing test patterns (look in `tests/` if present; otherwise bootstrap)
- **VALIDATE**: `pnpm test` passes; `pnpm playwright test` passes.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected | Edge |
|---|---|---|---|
| `matchesGeo({countries:['ID']}, {country:'ID'})` | ID visitor | true | |
| `matchesGeo({countries:['ID']}, {country:'SG'})` | SG visitor | false | |
| `matchesDevice({types:['mobile']}, 'iPhone UA')` | mobile UA | true | |
| `matchesDevice({types:['desktop']}, 'iPhone UA')` | mobile UA | false | |
| `matchesLogin({state:'logged-in'}, true)` | logged in | true | |
| `matchesPage({match:'starts-with', value:'/news'}, '/news/abc')` | | true | |
| `matchesPage({match:'regex', value:'['}, '/')` | invalid regex | false (no throw) | ✓ |
| `createCampaignSchema.parse({ name:'x', targeting:{operator:'AND', rules:[{kind:'geo', countries:['ID']}]}})` | valid | parses | |
| `createCampaignSchema.parse({ name:'', ... })` | empty name | throws | ✓ |
| filterCampaigns w/ gtm-attr rule | | excluded from server filter (partitioned to client) | ✓ |

### Edge Cases

- [ ] Empty targeting rules array → show to all
- [ ] Operator OR with zero matching rules → hide
- [ ] Campaign missing `goal` → no click handler attached
- [ ] Shadow DOM selector `[data-cta]` not found → no-op, campaign still shows
- [ ] gtm-attr rule but `window.dataLayer` undefined → treat as no-match, hide
- [ ] Draft row created via modal, then user closes tab mid-wizard → draft persists, recoverable via list
- [ ] Wizard route with invalid campaign id → redirect to list

---

## Validation Commands

```bash
# Dashboard
cd /Users/surya/kompas/oasis-proto
pnpm tsc --noEmit
pnpm lint
pnpm drizzle-kit generate   # produces 0007_* migration
pnpm drizzle-kit migrate
pnpm test
pnpm dev                    # smoke test
```
EXPECT: zero type errors, migration applies cleanly, tests pass.

```bash
# Edge worker
cd /Users/surya/kompas/oasis-edge
pnpm tsc --noEmit
pnpm test                   # vitest for new targeting predicates
pnpm dev                    # wrangler local
```
EXPECT: clean types, predicate unit tests green.

### Manual validation
- [ ] `/campaigns/on-site-messages` → "Create OSM Campaign" → modal opens
- [ ] Submit name → draft row visible in DB, browser on `/wizard/template`
- [ ] Pick `modal-with-cta-redirect` → open creative picker → select → html contains URL
- [ ] Step through target/trigger/goal/launch; each Next PATCHes campaign; reload page mid-wizard preserves state
- [ ] Launch → back to detail page with status `draft`
- [ ] Activate campaign manually (existing status transition) → KV shows new payload including `targeting`, `goal`
- [ ] Visit tenant site with `cf.country=ID` and logged-in cookie → banner injects only if rules match
- [ ] Click CTA → network beacon to `/ingest/engagement`, redirect follows

---

## Acceptance Criteria

- [ ] All 17 tasks complete
- [ ] All validation commands green
- [ ] Dashboard: modal → 5 wizard routes → draft saved
- [ ] Edge: filterCampaigns honors targeting; trigger engine honors gtm-attr + fires goal beacon
- [ ] KV payload shape matches updated `KVCampaign`
- [ ] Legacy `create.vue` removed

## Completion Checklist

- [ ] Zod schemas in shared/types, imported by both API and page
- [ ] Drizzle migration idempotent (DO $$ IF NOT EXISTS pattern)
- [ ] No `any` in new code except `(request as any).cf` mirror
- [ ] New edge types mirror shared types (copy, not import — edge has no path alias)
- [ ] Every new page has `definePageMeta({ layout: 'wizard' })`
- [ ] Creative picker emits typed payload
- [ ] Unit tests cover each predicate branch

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shadow DOM goal selector misses because HTML authors use shadow-incompatible markup | Med | Med | Ship template with known `[data-oasis-cta]` hook; document required attr |
| ReDoS via user-supplied regex in page rule | Low | High | Length cap + try/catch in `matchesPage`; SAFE_REGEX note in UI |
| Device detection drift across UA parsers | Med | Low | Minimal regex (mobile/tablet) — accept false classifications; flag as MVP |
| Type drift between dashboard `shared/types/campaign.ts` and edge `types.ts` | Med | Med | Add CI check comparing exported `Campaign`/`Targeting` shapes or publish shared package later |
| KV eventual-consistency delays new targeting | Low | Low | Existing — no change |
| Wizard draft orphaned if user abandons | Med | Low | Draft already filterable by status; add cleanup cron later |

## Notes

- Deep-linkable wizard routes preserved under campaign id so sharing a step URL works.
- Creative gallery is intentionally read-only + picker in this pass; cross-campaign creative reuse (breaking the FK) is a follow-up.
- `modal-with-cta-redirect` template HTML should expose three controls with `data-oasis-role`: `redirect`, `dismiss`, `close` — trigger engine attaches goal beacon on `redirect` by default.
- `partitionTargeting` returns `{server, client}`; server rules decide worker filter, client rules streamed via `window.__OASIS_DATA__` and evaluated before show.
- When detail/edit page is later updated to respect `targeting`/`goal`, reuse the same `TargetingRuleEditor` component.
