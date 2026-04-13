# OASIS Platform — Journey Progress

**Last updated:** 2026-04-13

---

## Legend

| Status | Meaning |
|--------|---------|
| `[ ]`  | Not started |
| `[~]`  | In progress |
| `[x]`  | Complete |
| `[-]`  | Blocked / Deferred |

---

## Duration Summary

| Goal | Milestones | Duration |
|------|-----------|----------|
| **1. Campaign Management (MVP)** | 1.1–1.8 | **~11 days** |
| **2. Customer Data Platform** | 2.1–2.4 | **~17 days** |
| **3. Journey Orchestration** | 3.1–3.2 | **~11 days** |
| **4. Reporting & Analytics** | 4.1 | **~5 days** |
| **5. User & Account Management** | 5.1–5.2 | **~5 days** |
| **6. Delivery API** | 6.1 | **~3 days** |
| | **Total** | **~52 days** |

---

## Goal 1: Campaign Management (MVP)

> Enable marketers to create, manage, and deliver banner campaigns across KG Media properties (Kompas.com, Kompas.id) via a self-serve dashboard with Redis-backed delivery sync.

### Milestone 1.1 — Project Scaffolding & Infrastructure `~0.5 day`

> Set up the Nuxt 4 project, local dev environment, and all foundational tooling.

#### Story 1.1.1 — Nuxt 4 Project Setup
- [x] Scaffold Nuxt 4 project with Nuxt UI + Tailwind CSS
- [x] Configure `nuxt.config.ts` (modules, devtools, CSS)
- [x] Configure `tsconfig.json`
- [x] Configure ESLint
- [ ] Add `runtimeConfig` block to `nuxt.config.ts` for env vars
- [ ] Install backend dependencies (drizzle-orm, postgres, ioredis, @aws-sdk/client-s3, zod)
- [ ] Install drizzle-kit as dev dependency

#### Story 1.1.2 — Docker & Local Services
- [ ] Create `docker-compose.yml` (PostgreSQL 16 + Redis 7)
- [ ] Verify `docker compose up -d` starts both services
- [ ] Verify connectivity from Nitro to Postgres and Redis

#### Story 1.1.3 — Environment Configuration
- [ ] Create `.env.example` with all required variables
- [ ] Create `.env` with real credentials (git-ignored)
- [ ] Verify `.gitignore` excludes `.env`

---

### Milestone 1.2 — Database & ORM `~0.5 day`

> Establish the Drizzle ORM schema for campaigns and creatives, with working migrations.

#### Story 1.2.1 — Drizzle Configuration
- [ ] Create `drizzle.config.ts`
- [ ] Create `server/utils/drizzle.ts` (DB singleton via `useRuntimeConfig`)

#### Story 1.2.2 — Campaign Schema
- [ ] Define `campaignStatusEnum` (draft, scheduled, active, paused, completed)
- [ ] Define `campaignPriorityEnum` (low, medium, high, critical)
- [ ] Define `campaigns` table (id, name, description, objective, status, priority, startDate, endDate, createdAt, updatedAt)
- [ ] Define `creatives` table (id, campaignId FK, type, fileUrl, fileName, fileSize, mimeType, clickUrl, altText, width, height, sortOrder, createdAt)

#### Story 1.2.3 — Migrations
- [ ] Generate initial migration with `drizzle-kit generate`
- [ ] Apply migration with `drizzle-kit migrate`
- [ ] Create `server/plugins/migrations.ts` for auto-migration on dev startup
- [ ] Verify tables exist in Postgres via Drizzle Studio or psql

---

### Milestone 1.3 — Server Utilities `~1 day`

> Build the core backend singletons: Redis sync, OBS upload, and shared types.

#### Story 1.3.1 — Redis Integration
- [ ] Create `server/utils/redis.ts` with ioredis singleton
- [ ] Implement `syncCampaignToRedis(campaign)` — write campaign + creatives JSON to `campaign:{id}`
- [ ] Implement `removeCampaignFromRedis(id)` — delete key + remove from `campaigns:active` set
- [ ] Implement `syncAllActiveCampaigns()` — bulk sync for startup/recovery
- [ ] Verify Redis read/write via `redis-cli`

#### Story 1.3.2 — OBS / S3 Upload Client
- [ ] Create `server/utils/obs.ts` with `@aws-sdk/client-s3` pointed at Huawei OBS endpoint
- [ ] Implement `uploadCreative(buffer, key, mimeType)`
- [ ] Implement `deleteCreative(key)`
- [ ] Implement `getPublicUrl(key)` returning `https://assets-oasis.kgmedia.id/{key}`
- [ ] Verify upload + CDN URL accessibility

#### Story 1.3.3 — Shared Types & Validation
- [ ] Create `shared/types/campaign.ts` with `CampaignStatus`, `CampaignPriority`, interfaces
- [ ] Define `createCampaignSchema` and `updateCampaignSchema` (Zod)
- [ ] Define `STATUS_TRANSITIONS` map

---

### Milestone 1.4 — Campaign API Endpoints `~2 days`

> Full RESTful API for campaign CRUD, lifecycle state machine, cloning, and bulk actions.

#### Story 1.4.1 — Campaign CRUD
- [ ] `GET /api/campaigns` — list with pagination, search, status filter, sort
- [ ] `POST /api/campaigns` — create campaign (Zod validation, default draft status)
- [ ] `GET /api/campaigns/[id]` — get campaign with creatives + computed fields
- [ ] `PUT /api/campaigns/[id]` — update campaign; re-sync Redis if active
- [ ] `DELETE /api/campaigns/[id]` — delete campaign; remove from Redis + OBS cleanup

#### Story 1.4.2 — Lifecycle State Machine
- [ ] `PATCH /api/campaigns/[id]/status` — change status with transition validation
- [ ] Enforce transition rules: draft->{scheduled,active}, scheduled->{active,draft}, active->{paused,completed}, paused->{active,completed}
- [ ] On activate/resume: call `syncCampaignToRedis()`
- [ ] On pause/complete: call `removeCampaignFromRedis()`
- [ ] Return error on invalid transitions

#### Story 1.4.3 — Clone & Bulk Actions
- [ ] `POST /api/campaigns/[id]/clone` — clone as new draft (new ID, cleared dates, copy creatives)
- [ ] `PATCH /api/campaigns/bulk` — bulk pause/resume/archive with Redis sync
- [ ] Verify bulk actions apply to all selected campaigns

#### Story 1.4.4 — Creative Upload
- [ ] `POST /api/upload/creative` — accept multipart/form-data
- [ ] Validate file type (jpg, png, gif, webp, svg) and size (max 10MB)
- [ ] Upload to OBS, return `{ url, fileName, fileSize, mimeType, width, height }`

---

### Milestone 1.5 — Dashboard UI: Theme & Layout `~1 day`

> Build the dashboard shell with sidebar navigation, dark mode, and premium aesthetics.

#### Story 1.5.1 — Theme Configuration
- [ ] Update `app/app.config.ts` — primary: indigo, neutral: zinc, dark mode default
- [ ] Update `app/assets/css/main.css` — replace green palette with indigo/violet
- [ ] Add custom CSS: glassmorphism cards, gradient backgrounds, page transitions, status badge colors

#### Story 1.5.2 — Dashboard Layout
- [ ] Create `app/layouts/default.vue` — sidebar + header + main slot
- [ ] Sidebar: logo, nav links (Campaigns; placeholders: Audiences, Journeys, Reports)
- [ ] Header: breadcrumb, page title
- [ ] Mobile responsive: sidebar collapses to drawer
- [ ] Update `app/app.vue` — remove starter content, use dashboard layout

#### Story 1.5.3 — Index Redirect
- [ ] Update `app/pages/index.vue` — redirect to `/campaigns`

---

### Milestone 1.6 — Dashboard UI: Campaign Pages `~3 days`

> Build the three main campaign pages: list, create, and detail/edit.

#### Story 1.6.1 — Campaign List Page (`campaigns/index.vue`)
- [ ] Data table with `UTable` (TanStack Table)
- [ ] Columns: Name, Status badge, Priority, Date Range, Actions dropdown
- [ ] Status filter chips (All, Active, Draft, Scheduled, Paused, Completed)
- [ ] Debounced search input
- [ ] Server-side pagination + page size selector
- [ ] Column header sorting
- [ ] Row checkbox selection + bulk action toolbar
- [ ] Empty state with CTA
- [ ] Skeleton loading rows

#### Story 1.6.2 — Campaign Create Page (`campaigns/create.vue`)
- [ ] Section 1: Campaign details form (name, description, objective, priority, dates) with Zod validation
- [ ] Section 2: Creative upload — drag & drop zone with preview, click-through URL, alt text
- [ ] Section 3: Review summary — "Save as Draft" and "Schedule" CTAs
- [ ] Wire up to `POST /api/campaigns` + `POST /api/upload/creative`
- [ ] Success redirect to campaign detail page

#### Story 1.6.3 — Campaign Detail / Edit Page (`campaigns/[id].vue`)
- [ ] Header: campaign name + status badge + action buttons (Edit, Pause/Resume, Delete)
- [ ] Info card: campaign metadata
- [ ] Creatives gallery: grid with previews, click URL, dimensions
- [ ] Status transition button (shows valid next states)
- [ ] Inline edit mode with save/cancel
- [ ] Delete confirmation dialog

---

### Milestone 1.7 — Campaign Components & Composables `~2 days`

> Build reusable components and data-fetching composables.

#### Story 1.7.1 — Campaign Components
- [ ] `CampaignStatusBadge.vue` — color-coded badge with icon per status
- [ ] `CampaignCard.vue` — card-view alternative for list
- [ ] `CreativeUploader.vue` — drag & drop + file validation
- [ ] `CreativePreview.vue` — image preview with metadata
- [ ] `StatusTransitionButton.vue` — dropdown with valid next states
- [ ] `CampaignFilters.vue` — status chips + search input
- [ ] `BulkActionToolbar.vue` — appears when rows selected (Pause, Resume, Archive)
- [ ] `ConfirmDialog.vue` — reusable `UModal` confirmation

#### Story 1.7.2 — Composables
- [ ] `useCampaigns.ts` — reactive list with filters, pagination, search; wraps `useFetch`
- [ ] `useCampaign.ts` — single campaign CRUD: fetch, create, update, delete, changeStatus, clone
- [ ] `useCreativeUpload.ts` — upload with progress tracking

---

### Milestone 1.8 — Integration Testing & QA `~1 day`

> End-to-end verification of the full campaign lifecycle.

#### Story 1.8.1 — API Smoke Tests
- [ ] Create a draft campaign via `POST /api/campaigns`
- [ ] List campaigns via `GET /api/campaigns`
- [ ] Activate campaign → verify Redis key `campaign:{id}` exists
- [ ] Pause campaign → verify Redis key removed
- [ ] Upload creative → verify CDN URL accessible
- [ ] Clone campaign → verify new draft created
- [ ] Bulk pause multiple campaigns

#### Story 1.8.2 — Browser E2E Walkthrough
- [ ] Full lifecycle in browser: Create → Schedule → Activate → Pause → Resume → Complete
- [ ] Creative upload shows preview and CDN URL works
- [ ] Bulk select + pause works
- [ ] Responsive layout on mobile viewport
- [ ] Redis data consistency via `redis-cli` inspection

---

## Goal 2: Customer Data Platform

> Provide a centralized contact database with profile management, audience segmentation, and event tracking powered by Oval integration.

### Milestone 2.1 — Contact Management `~5 days`

#### Story 2.1.1 — Contact Database Schema
- [ ] Define contacts table (core fields: name, email, phone, birthday, location, gender, language)
- [ ] Define contact_devices table (platform, OS version, app version)
- [ ] Define contact_custom_values table (EAV for custom attributes)
- [ ] Define contact_events table (timestamped event records)
- [ ] Generate and apply migrations

#### Story 2.1.2 — Contact CRUD API
- [ ] List contacts with pagination + advanced AND/OR filtering
- [ ] Create/update individual contacts
- [ ] Bulk import via CSV/Excel with field mapping
- [ ] Export filtered contact lists
- [ ] Per-contact timeline of events

#### Story 2.1.3 — Contact Management UI
- [ ] Contact list page with search, filters, pagination
- [ ] Contact detail page with profile, devices, custom attributes, event timeline
- [ ] Contact creation form
- [ ] CSV/Excel upload UI with field mapping
- [ ] PII field masking for restricted users

---

### Milestone 2.2 — Attributes & Events `~3 days`

#### Story 2.2.1 — Attribute Schema Management
- [ ] Define contact_attributes table (default + custom, type: string/number/boolean/date)
- [ ] CRUD API for custom attributes
- [ ] Attribute management UI with grouped category view
- [ ] Source tagging (API, email, mobile SDK, web)

#### Story 2.2.2 — Event Type Management
- [ ] Define event_types table (default + custom, with parameters)
- [ ] CRUD API for custom event types
- [ ] Event type management UI with grouped category view
- [ ] Deletion safeguards (warning if data exists)

---

### Milestone 2.3 — Audience Segmentation `~5 days`

#### Story 2.3.1 — Segment Engine
- [ ] Define segments table (static vs dynamic, rules JSON, tags)
- [ ] Static segment: add contacts via upload or UI
- [ ] Dynamic segment: rule-based auto-update on filter criteria
- [ ] Segment contact count estimation + on-demand refresh
- [ ] Export segment contact lists

#### Story 2.3.2 — Segmentation UI
- [ ] Segment list page with tags and counts
- [ ] Segment builder with AND/OR rule editor
- [ ] Audience size preview before save
- [ ] Deletion confirmation when used in active campaigns

---

### Milestone 2.4 — Oval Event Integration `~4 days`

#### Story 2.4.1 — Event Ingestion Pipeline
- [ ] Connect to Oval API (webhook or polling)
- [ ] Ingest events with parameters into contact_events
- [ ] Enrich customer profiles from event stream
- [ ] Near real-time profile updates

#### Story 2.4.2 — Ingest API
- [ ] `POST /api/v1/contacts/ingest` endpoint
- [ ] Upsert logic (email → phone → contact_id resolution)
- [ ] Auto-create custom attribute definitions from unknown keys
- [ ] Assign contacts to static segments by ID
- [ ] API token management UI (generate, rotate, copy, masked display)

---

## Goal 3: Journey Orchestration

> Enable multi-step, multi-channel campaign automation triggered by events or schedules.

### Milestone 3.1 — Email Sequences `~4 days`

#### Story 3.1.1 — Drip Campaign Builder
- [ ] Time-based email sequence configuration (delays, schedules)
- [ ] Reusable email templates with dynamic personalization
- [ ] Schedule options: immediate, delayed, specific date/time

---

### Milestone 3.2 — Multi-Channel Journeys `~7 days`

#### Story 3.2.1 — Journey Builder UI
- [ ] Visual journey flow editor
- [ ] Channel nodes: email, push, in-app banner, web banner (OASIS-DELIVERY)
- [ ] Sequence + parallel channel coordination
- [ ] Fallback logic (primary channel fails → fallback channel)

#### Story 3.2.2 — Trigger-Based Automations
- [ ] Event triggers from Oval events with parameter filtering
- [ ] Condition nodes: branching on profile attributes, segment membership, engagement
- [ ] Rate limiting + quiet hours configuration

---

## Goal 4: Reporting & Analytics

> Real-time and historical analytics for campaign performance, audience health, and engagement.

### Milestone 4.1 — Analytics Dashboard `~5 days`

#### Story 4.1.1 — Overview Dashboard
- [ ] Summary counts: contacts, devices, events, segments
- [ ] Contact reachability distribution chart
- [ ] Device platform distribution (iOS vs Android)
- [ ] Top events by frequency (last N days)
- [ ] Events over time line chart (14 days)
- [ ] Day-over-day trend indicators

#### Story 4.1.2 — Campaign Performance
- [ ] Banner impression tracking (async logging from OASIS-DELIVERY)
- [ ] Click tracking via redirect URLs
- [ ] CTR auto-calculation at campaign/journey/channel level
- [ ] Conversion tracking mapped to Oval events
- [ ] Conversion funnel visualization (impression → click → conversion)

#### Story 4.1.3 — Real-Time Dashboard
- [ ] Live metrics with auto-refresh (WebSocket or polling)
- [ ] Time range filters (today, 7d, 30d, custom)
- [ ] Campaign-level drill-down
- [ ] CSV/Excel export

---

## Goal 5: User & Account Management

> Multi-tenant access control with roles, invitations, and PII restrictions.

### Milestone 5.1 — Accounts & Roles `~4 days`

#### Story 5.1.1 — Account Management
- [ ] Define accounts table
- [ ] Super admin: create/enable/disable accounts
- [ ] All data scoped by `account_id`

#### Story 5.1.2 — User Management
- [ ] Define users + user_account_access tables
- [ ] Role assignment: Super Admin, Admin, User
- [ ] Account switching UI
- [ ] PII access restrictions per user

#### Story 5.1.3 — Invitation Flow
- [ ] Define user_invitations table (token, expiry)
- [ ] Admin invite via email with role assignment
- [ ] Token-based acceptance: set password, land in correct account
- [ ] Resend invitation capability

---

### Milestone 5.2 — API Settings `~1 day`

#### Story 5.2.1 — API Token Management UI
- [ ] Display masked API token
- [ ] Generate / rotate token
- [ ] Copy to clipboard
- [ ] Animated reveal/hide

---

## Goal 6: High-Traffic Delivery API (OASIS-DELIVERY)

> Independently deployable, Redis-backed delivery API for serving banner creatives at scale to Kompas.com, Kompas.id, and other KG Media properties.

### Milestone 6.1 — Delivery Service `~3 days`

#### Story 6.1.1 — Delivery API Setup
- [ ] Separate Nitro project or deployment for OASIS-DELIVERY
- [ ] Redis-only reads (no PostgreSQL access)
- [ ] `defineCachedEventHandler` for sub-ms response times

#### Story 6.1.2 — Banner Serving Endpoints
- [ ] `GET /api/deliver/banner` — serve campaign creative by placement/targeting
- [ ] Query by placement, device type, geography
- [ ] Return creative JSON (image URL, click URL, alt text, dimensions)
- [ ] Async impression logging (non-blocking)

#### Story 6.1.3 — Performance Validation
- [ ] Load test: verify ≥ 1,000 RPM baseline
- [ ] Verify sub-ms Redis cache hit latency
- [ ] Verify zero PostgreSQL queries during delivery
