# OASIS Platform — Journey Progress

**Last updated:** 2026-04-14

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
- [x] Add `runtimeConfig` block to `nuxt.config.ts` for env vars
- [x] Install backend dependencies (drizzle-orm, postgres, ioredis, @aws-sdk/client-s3, zod)
- [x] Install drizzle-kit as dev dependency

#### Story 1.1.2 — Docker & Local Services
- [x] Create `docker-compose.yml` (PostgreSQL 16 + Redis 7)
- [x] Verify `docker compose up -d` starts both services
- [x] Verify connectivity from Nitro to Postgres and Redis

#### Story 1.1.3 — Environment Configuration
- [x] Create `.env.example` with all required variables
- [x] Create `.env` with real credentials (git-ignored)
- [x] Verify `.gitignore` excludes `.env`

---

### Milestone 1.2 — Database & ORM `~0.5 day`

> Establish the Drizzle ORM schema for campaigns and creatives, with working migrations.

#### Story 1.2.1 — Drizzle Configuration
- [x] Create `drizzle.config.ts`
- [x] Create `server/utils/drizzle.ts` (DB singleton via `useRuntimeConfig`)

#### Story 1.2.2 — Campaign Schema
- [x] Define `campaignStatusEnum` (draft, scheduled, active, paused, completed)
- [x] Define `campaignPriorityEnum` (low, medium, high, critical)
- [x] Define `campaigns` table (id, name, description, objective, status, priority, startDate, endDate, createdAt, updatedAt)
- [x] Define `creatives` table (id, campaignId FK, type, fileUrl, fileName, fileSize, mimeType, clickUrl, altText, width, height, sortOrder, createdAt)

#### Story 1.2.3 — Migrations
- [x] Generate initial migration with `drizzle-kit generate`
- [x] Apply migration with `drizzle-kit migrate`
- [x] Create `server/plugins/migrations.ts` for auto-migration on dev startup
- [x] Verify tables exist in Postgres via Drizzle Studio or psql

---

### Milestone 1.3 — Server Utilities `~1 day`

> Build the core backend singletons: Redis sync, OBS upload, and shared types.

#### Story 1.3.1 — Redis Integration
- [x] Create `server/utils/redis.ts` with ioredis singleton
- [x] Implement `syncCampaignToRedis(campaign)` — write campaign + creatives JSON to `campaign:{id}`
- [x] Implement `removeCampaignFromRedis(id)` — delete key + remove from `campaigns:active` set
- [x] Implement `syncAllActiveCampaigns()` — bulk sync for startup/recovery
- [x] Verify Redis read/write via `redis-cli`

#### Story 1.3.2 — OBS / S3 Upload Client
- [x] Create `server/utils/obs.ts` with `@aws-sdk/client-s3` pointed at Huawei OBS endpoint
- [x] Implement `uploadCreative(buffer, key, mimeType)`
- [x] Implement `deleteCreative(key)`
- [x] Implement `getPublicUrl(key)` returning `https://assets-oasis.kgmedia.id/{key}`
- [x] Verify upload + CDN URL accessibility

#### Story 1.3.3 — Shared Types & Validation
- [x] Create `shared/types/campaign.ts` with `CampaignStatus`, `CampaignPriority`, interfaces
- [x] Define `createCampaignSchema` and `updateCampaignSchema` (Zod)
- [x] Define `STATUS_TRANSITIONS` map

---

### Milestone 1.4 — Campaign API Endpoints `~2 days`

> Full RESTful API for campaign CRUD, lifecycle state machine, cloning, and bulk actions.

#### Story 1.4.1 — Campaign CRUD
- [x] `GET /api/campaigns` — list with pagination, search, status filter, sort
- [x] `POST /api/campaigns` — create campaign (Zod validation, default draft status)
- [x] `GET /api/campaigns/[id]` — get campaign with creatives + computed fields
- [x] `PUT /api/campaigns/[id]` — update campaign; re-sync Redis if active
- [x] `DELETE /api/campaigns/[id]` — delete campaign; remove from Redis + OBS cleanup

#### Story 1.4.2 — Lifecycle State Machine
- [x] `PATCH /api/campaigns/[id]/status` — change status with transition validation
- [x] Enforce transition rules: draft->{scheduled,active}, scheduled->{active,draft}, active->{paused,completed}, paused->{active,completed}
- [x] On activate/resume: call `syncCampaignToRedis()`
- [x] On pause/complete: call `removeCampaignFromRedis()`
- [x] Return error on invalid transitions

#### Story 1.4.3 — Clone & Bulk Actions
- [x] `POST /api/campaigns/[id]/clone` — clone as new draft (new ID, cleared dates, copy creatives)
- [x] `PATCH /api/campaigns/bulk` — bulk pause/resume/archive with Redis sync
- [x] Verify bulk actions apply to all selected campaigns

#### Story 1.4.4 — Creative Upload
- [x] `POST /api/upload/creative` — accept multipart/form-data
- [x] Validate file type (jpg, png, gif, webp, svg) and size (max 10MB)
- [x] Upload to OBS, return `{ url, fileName, fileSize, mimeType, width, height }`

---

### Milestone 1.5 — Dashboard UI: Theme & Layout `~1 day`

> Build the dashboard shell with sidebar navigation, dark mode, and premium aesthetics.

#### Story 1.5.1 — Theme Configuration
- [x] Update `app/app.config.ts` — primary: indigo, neutral: zinc, dark mode default
- [x] Update `app/assets/css/main.css` — replace green palette with indigo/violet
- [x] Add custom CSS: glassmorphism cards, gradient backgrounds, page transitions, status badge colors

#### Story 1.5.2 — Dashboard Layout
- [x] Create `app/layouts/default.vue` — sidebar + header + main slot
- [x] Sidebar: logo, nav links (Campaigns; placeholders: Audiences, Journeys, Reports)
- [x] Header: breadcrumb, page title
- [x] Mobile responsive: sidebar collapses to drawer
- [x] Update `app/app.vue` — remove starter content, use dashboard layout

#### Story 1.5.3 — Index Redirect
- [x] Update `app/pages/index.vue` — redirect to `/campaigns`

---

### Milestone 1.6 — Dashboard UI: Campaign Pages `~3 days`

> Build the three main campaign pages: list, create, and detail/edit.

#### Story 1.6.1 — Campaign List Page (`campaigns/index.vue`)
- [x] Data table with `UTable` (TanStack Table)
- [x] Columns: Name, Status badge, Priority, Date Range, Actions dropdown
- [x] Status filter chips (All, Active, Draft, Scheduled, Paused, Completed)
- [x] Debounced search input
- [x] Server-side pagination + page size selector
- [x] Column header sorting
- [x] Row checkbox selection + bulk action toolbar
- [x] Empty state with CTA
- [x] Skeleton loading rows

#### Story 1.6.2 — Campaign Create Page (`campaigns/create.vue`)
- [x] Section 1: Campaign details form (name, description, objective, priority, dates) with Zod validation
- [x] Section 2: Creative upload — drag & drop zone with preview, click-through URL, alt text
- [x] Section 3: Review summary — "Save as Draft" and "Schedule" CTAs
- [x] Wire up to `POST /api/campaigns` + `POST /api/upload/creative`
- [x] Success redirect to campaign detail page

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
- [x] `CampaignStatusBadge.vue` — color-coded badge with icon per status
- [x] `CampaignCard.vue` — card-view alternative for list
- [x] `CreativeUploader.vue` — drag & drop + file validation
- [x] `CreativePreview.vue` — image preview with metadata
- [x] `StatusTransitionButton.vue` — dropdown with valid next states
- [x] `CampaignFilters.vue` — status chips + search input
- [x] `BulkActionToolbar.vue` — appears when rows selected (Pause, Resume, Archive)
- [x] `ConfirmDialog.vue` — reusable `UModal` confirmation

#### Story 1.7.2 — Composables
- [x] `useCampaigns.ts` — reactive list with filters, pagination, search; wraps `useFetch`
- [x] `useCampaign.ts` — single campaign CRUD: fetch, create, update, delete, changeStatus, clone
- [x] `useCreativeUpload.ts` — upload with progress tracking

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
- [x] Define contacts table (core fields: name, email, phone, birthday, location, gender, language)
- [x] Define contact_devices table (platform, OS version, app version)
- [x] Define contact_custom_values table (EAV for custom attributes)
- [x] Define contact_events table (timestamped event records)
- [x] Generate and apply migrations

#### Story 2.1.2 — Contact CRUD API
- [x] List contacts with pagination + advanced AND/OR filtering
- [x] Create/update individual contacts
- [x] Bulk import via CSV/Excel with field mapping
- [x] Export filtered contact lists
- [x] Per-contact timeline of events

#### Story 2.1.3 — Contact Management UI
- [x] Contact list page with search, filters, pagination
- [x] Contact detail page with profile, devices, custom attributes, event timeline
- [x] Contact creation form
- [ ] CSV/Excel upload UI with field mapping
- [ ] PII field masking for restricted users

---

### Milestone 2.2 — Attributes & Events `~3 days`

#### Story 2.2.1 — Attribute Schema Management
- [x] Define contact_attributes table (default + custom, type: string/number/boolean/date)
- [x] CRUD API for custom attributes
- [x] Attribute management UI with grouped category view
- [x] Source tagging (API, email, mobile SDK, web)

#### Story 2.2.2 — Event Type Management
- [x] Define event_types table (default + custom, with parameters)
- [x] CRUD API for custom event types
- [x] Event type management UI with grouped category view
- [x] Deletion safeguards (warning if data exists)

---

### Milestone 2.3 — Audience Segmentation `~5 days`

#### Story 2.3.1 — Segment Engine
- [x] Define segments table (static vs dynamic, rules JSON, tags)
- [x] Static segment: add contacts via upload or UI
- [~] Dynamic segment: rule-based auto-update on filter criteria
- [x] Segment contact count estimation + on-demand refresh
- [ ] Export segment contact lists

#### Story 2.3.2 — Segmentation UI
- [x] Segment list page with tags and counts
- [~] Segment builder with AND/OR rule editor
- [ ] Audience size preview before save
- [x] Deletion confirmation when used in active campaigns

---

### Milestone 2.4 — Oval Event Integration `~4 days`

#### Story 2.4.1 — Event Ingestion Pipeline
- [ ] Connect to Oval API (webhook or polling)
- [x] Ingest events with parameters into contact_events
- [x] Enrich customer profiles from event stream
- [x] Near real-time profile updates

#### Story 2.4.2 — Ingest API
- [x] `POST /api/v1/contacts/ingest` endpoint
- [x] Upsert logic (email → phone → contact_id resolution)
- [x] Auto-create custom attribute definitions from unknown keys
- [x] Assign contacts to static segments by ID

---

## Goal 3: Journey Orchestration

> Enable multi-step, multi-channel campaign automation triggered by events or schedules.

### Milestone 3.1 — Email Sequences `~4 days`

#### Story 3.1.1 — Drip Campaign Builder
- [x] Time-based email sequence configuration (delays, schedules)
- [x] Reusable email templates with dynamic personalization
- [x] Schedule options: immediate, delayed, specific date/time

---

### Milestone 3.2 — Multi-Channel Journeys `~7 days`

#### Story 3.2.1 — Journey Builder UI
- [x] Visual journey flow editor
- [x] Channel nodes: email, push, in-app banner, web banner (OASIS-DELIVERY)
- [x] Sequence + parallel channel coordination
- [~] Fallback logic (primary channel fails → fallback channel)

#### Story 3.2.2 — Trigger-Based Automations
- [x] Event triggers from Oval events with parameter filtering
- [x] Condition nodes: branching on profile attributes, segment membership, engagement
- [x] Rate limiting + quiet hours configuration

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
