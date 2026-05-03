# OASIS Campaign Management — Implementation Plan

## Background

Build the **Campaign Management** module (PRD §8.1) as the first deliverable of the OASIS platform. This includes full campaign CRUD, lifecycle state machine with Redis sync, creative upload to Huawei OBS/CDN, and a premium marketer dashboard — all from a greenfield Nuxt 4 project. The platform serves KG Media digital properties including **Kompas.com** and **Kompas.id** (PRD §1).

---

## User Review Required

> [!IMPORTANT]
> **OBS Credentials** — The provided Access Key and Secret Key will be stored in `.env` (git-ignored). The CDN base URL `https://assets-oasis.kgmedia.id` will be used to construct public URLs for uploaded creatives.

> [!WARNING]
> **No Authentication** — Per your request, auth is skipped for MVP. All dashboard routes are publicly accessible. This must be addressed before production (see PRD §6 Security and §8.7 User & Account Management).

> [!IMPORTANT]
> **Nuxt UI v4 requires TailwindCSS** — Nuxt UI v4 ships with Tailwind as a peer dependency. The plan uses Tailwind via Nuxt UI's built-in integration (not standalone). This is required, not optional.

---

## Proposed Changes

### 1. Project Scaffolding & Infrastructure

#### [NEW] Nuxt 4 Project (`oasis-dashboard`)

Scaffold inside the current `oasis-dashboard` workspace:

```bash
npx nuxi@latest init ./ --package-manager npm --git-init false
npm install @nuxt/ui tailwindcss
```

**Nuxt 4 directory structure:**

```
oasis-dashboard/
├── app/                          # Frontend (Vue)
│   ├── assets/css/main.css       # Tailwind + Nuxt UI imports
│   ├── components/               # Vue components
│   │   ├── campaign/             # Campaign-specific components
│   │   └── ui/                   # Shared UI wrappers
│   ├── composables/              # Client-side composables
│   ├── layouts/
│   │   └── default.vue           # Dashboard shell layout
│   ├── pages/
│   │   ├── index.vue             # Dashboard home (redirect to campaigns)
│   │   └── campaigns/
│   │       ├── index.vue         # Campaign list
│   │       ├── create.vue        # Campaign creation form
│   │       └── [id].vue          # Campaign detail / edit
│   ├── app.vue
│   └── app.config.ts             # Nuxt UI theme tokens
├── server/                       # Backend (Nitro)
│   ├── api/campaigns/            # Campaign REST endpoints
│   ├── api/upload/               # Creative upload endpoints
│   ├── database/
│   │   ├── schema.ts             # Drizzle schema
│   │   └── migrations/           # Generated migrations
│   ├── utils/
│   │   ├── drizzle.ts            # DB connection singleton
│   │   ├── redis.ts              # Redis connection singleton
│   │   └── obs.ts                # OBS/S3 client singleton
│   └── plugins/
│       └── migrations.ts         # Auto-run migrations on dev start
├── shared/
│   └── types/                    # Shared TypeScript types
│       └── campaign.ts           # Campaign enums, interfaces
├── docker-compose.yml            # PostgreSQL + Redis
├── drizzle.config.ts             # Drizzle Kit config
├── nuxt.config.ts
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Template for env vars
└── package.json
```

---

#### [NEW] `docker-compose.yml`

PostgreSQL 16 + Redis 7 for local development:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: oasis
      POSTGRES_USER: oasis
      POSTGRES_PASSWORD: oasis_dev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

#### [NEW] `.env` / `.env.example`

```env
# Database
DATABASE_URL=postgresql://oasis:oasis_dev@localhost:5432/oasis

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Huawei OBS (S3-compatible)
OBS_ENDPOINT=https://obs.ap-southeast-3.myhuaweicloud.com
OBS_ACCESS_KEY_ID=HPUAMQ9NUEQOW98S4DVS
OBS_SECRET_ACCESS_KEY=Vapfsv5I4nYlBIdQdpOXoYTTV0YNGIbRfziHSkcB
OBS_BUCKET=assets-oasis
OBS_CDN_URL=https://assets-oasis.kgmedia.id
```

> [!NOTE]
> OBS region confirmed: `ap-southeast-3`. Bucket name confirmed: `assets-oasis` (PRD §11, questions 6–7).

---

### 2. Database Schema (Drizzle ORM)

#### [NEW] `server/database/schema.ts`

```typescript
// Campaign status enum
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed'
]);

// Campaign priority enum
export const campaignPriorityEnum = pgEnum('campaign_priority', [
  'low',
  'medium',
  'high',
  'critical'
]);

// Campaigns table
export const campaigns = pgTable('campaigns', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  objective:   varchar('objective', { length: 255 }),
  status:      campaignStatusEnum('status').default('draft').notNull(),
  priority:    campaignPriorityEnum('priority').default('medium').notNull(),
  startDate:   timestamp('start_date', { withTimezone: true }),
  endDate:     timestamp('end_date', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Campaign creatives table
export const creatives = pgTable('creatives', {
  id:           uuid('id').primaryKey().defaultRandom(),
  campaignId:   uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  type:         varchar('type', { length: 50 }).notNull(),        // 'image' | 'html' | 'rich_media'
  fileUrl:      text('file_url').notNull(),                        // CDN URL
  fileName:     varchar('file_name', { length: 255 }).notNull(),
  fileSize:     integer('file_size'),                              // bytes
  mimeType:     varchar('mime_type', { length: 100 }),
  clickUrl:     text('click_url'),
  altText:      varchar('alt_text', { length: 500 }),
  width:        integer('width'),
  height:       integer('height'),
  sortOrder:    integer('sort_order').default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

#### [NEW] `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

#### Migration Workflow

```bash
npx drizzle-kit generate   # Generate migration after schema changes
npx drizzle-kit migrate    # Apply pending migrations
npx drizzle-kit studio     # Visual DB browser (dev)
npx drizzle-kit push       # Push schema diff directly (dev only, skips migration files)
npx drizzle-kit check      # Check for schema drift
```

Auto-migration on dev startup via `server/plugins/migrations.ts`:

```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator'

export default defineNitroPlugin(async () => {
  const db = useDB()
  await migrate(db, { migrationsFolder: './server/database/migrations' })
})
```

> Full ORM reference: [`docs/orm.md`](./orm.md)

---

### 3. Server Utilities

#### [NEW] `server/utils/drizzle.ts`

Singleton DB connection using `drizzle-orm/postgres-js` + `postgres` driver. Uses `useRuntimeConfig()` to read `DATABASE_URL`.

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

let db: ReturnType<typeof drizzle>

export function useDB() {
  if (!db) {
    const config = useRuntimeConfig()
    const client = postgres(config.databaseUrl)
    db = drizzle(client, { schema })
  }
  return db
}
```

Usage in any Nitro handler: `const db = useDB()`

#### [NEW] `server/utils/redis.ts`

Singleton Redis client using `ioredis`. Provides:
- `getRedisClient()` — returns the shared Redis instance
- Helper methods for campaign data sync:
  - `syncCampaignToRedis(campaign)` — writes active campaign + creatives as JSON to Redis key `campaign:{id}`
  - `removeCampaignFromRedis(campaignId)` — deletes the key
  - `syncAllActiveCampaigns()` — bulk sync (for startup/recovery)

**Redis key design:**
```
campaign:{uuid}          → JSON blob of campaign + creatives (for delivery API)
campaigns:active         → Redis SET of active campaign IDs
campaigns:by-placement:{placement} → Redis SET of campaign IDs for a given placement
```

#### [NEW] `server/utils/obs.ts`

S3-compatible client using `@aws-sdk/client-s3` with Huawei OBS endpoint. Provides:
- `uploadCreative(file, key)` — uploads to OBS bucket
- `deleteCreative(key)` — removes from OBS bucket
- `getPublicUrl(key)` — returns CDN URL (`https://assets-oasis.kgmedia.id/{key}`) — served to Kompas.com, Kompas.id, and other KG Media properties via OASIS-DELIVERY (PRD §5)

---

### 4. API Endpoints (Nitro Server Routes)

All endpoints are RESTful under `/api/campaigns/`.

#### [NEW] `server/api/campaigns/index.get.ts` — List Campaigns
- Query params: `status`, `search`, `page`, `limit`, `sortBy`, `sortOrder`
- Returns paginated list with total count

#### [NEW] `server/api/campaigns/index.post.ts` — Create Campaign
- Body: campaign fields + optional creatives metadata
- Validates input with Zod
- Creates campaign in `draft` status
- Returns created campaign

#### [NEW] `server/api/campaigns/[id].get.ts` — Get Campaign Detail
- Returns campaign with its creatives
- Includes computed fields (e.g., `isEditable`, `daysRemaining`)

#### [NEW] `server/api/campaigns/[id].put.ts` — Update Campaign
- Updates campaign fields
- If campaign is `active`, re-syncs to Redis after update
- Validates status transition rules

#### [NEW] `server/api/campaigns/[id].delete.ts` — Delete Campaign
- Soft delete or hard delete (draft only)
- Removes from Redis if active
- Deletes associated creatives from OBS

#### [NEW] `server/api/campaigns/[id]/status.patch.ts` — Change Campaign Status

**State machine rules:**

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> scheduled : Schedule (requires start date)
    draft --> active : Activate
    scheduled --> active : Start date reached / manual activate
    scheduled --> draft : Unschedule
    active --> paused : Pause
    active --> completed : Complete / end date reached
    paused --> active : Resume
    paused --> completed : Complete
    completed --> draft : Clone (creates new campaign)
```

- **Activate/Resume** → Sync campaign data to Redis (makes banners available to OASIS-DELIVERY per PRD §5 data flow)
- **Pause/Complete** → Remove campaign data from Redis (instantly stops delivery per PRD §8.1.2)
- Returns updated campaign with new status

#### [NEW] `server/api/campaigns/[id]/clone.post.ts` — Clone Campaign
- Copies campaign as new `draft` (new ID, cleared dates)
- Copies creatives references

#### [NEW] `server/api/campaigns/bulk.patch.ts` — Bulk Actions
- Body: `{ ids: string[], action: 'pause' | 'resume' | 'archive' }`
- Applies status transitions to multiple campaigns
- Syncs/removes Redis accordingly

---

#### [NEW] `server/api/upload/creative.post.ts` — Upload Creative File
- Accepts `multipart/form-data`
- Validates file type (image: jpg/png/gif/webp/svg, max 10MB)
- Uploads to OBS via S3-compatible client
- Returns `{ url, fileName, fileSize, mimeType, width, height }`

---

### 5. Frontend — Dashboard UI

The dashboard follows a **dark-mode sidebar layout** using Nuxt UI's `DashboardLayout` pattern with premium aesthetics (PRD §7.1 OASIS-DASHBOARD Tech Stack). Responsive for tablet and desktop (PRD §6 Browser Support).

#### [NEW] `app/app.config.ts` — Theme Configuration

Custom Nuxt UI theme with:
- Primary color: indigo/violet gradient palette
- Dark mode as default
- Custom component variants for cards, buttons, badges

#### [NEW] `app/assets/css/main.css`

```css
@import "tailwindcss";
@import "@nuxt/ui";
```

Plus custom CSS for:
- Glassmorphism card effects
- Gradient backgrounds
- Smooth page transitions
- Status badge colors (green=active, yellow=scheduled, gray=draft, red=paused, blue=completed)

---

#### [NEW] `app/layouts/default.vue` — Dashboard Shell

- **Sidebar**: Navigation with logo, menu items (Campaigns; future: Audiences §8.2, Journeys §8.5, Reports §8.6)
- **Header**: Breadcrumb, global search, notifications placeholder
- **Main content**: `<slot />` with page transitions
- Responsive: collapses to mobile drawer on small screens

---

#### [NEW] `app/pages/campaigns/index.vue` — Campaign List Page

| Feature | Implementation |
|---------|---------------|
| **Data table** | Nuxt UI `<UTable>` powered by TanStack Table |
| **Columns** | Name, Status (badge), Priority, Date Range, Impressions, CTR, Actions |
| **Search** | Debounced text search via query param |
| **Filters** | Status filter chips (All, Active, Draft, Scheduled, Paused, Completed) |
| **Sorting** | Column header sorting |
| **Pagination** | Server-side pagination with page size selector |
| **Bulk actions** | Row selection checkboxes + bulk action toolbar (Pause, Resume, Archive) |
| **Row actions** | Dropdown menu (View, Edit, Clone, Delete) |
| **Empty state** | Illustrated empty state with CTA to create first campaign |
| **Loading** | Skeleton rows during fetch |

---

#### [NEW] `app/pages/campaigns/create.vue` — Campaign Creation Page

Multi-section form with validation:

1. **Campaign Details** — Name, description, objective, priority (select), start/end dates (date picker)
2. **Creative Upload** — Drag & drop zone with preview, click-through URL, alt text, dimensions display
3. **Review & Submit** — Summary card with all entered data, "Save as Draft" and "Schedule" CTAs

Uses Nuxt UI `<UForm>` with Zod schema validation. File upload uses presigned URL pattern for direct browser → OBS upload.

---

#### [NEW] `app/pages/campaigns/[id].vue` — Campaign Detail / Edit Page

- **Header**: Campaign name + status badge + action buttons (Edit, Pause/Resume, Delete)
- **Info section**: Campaign metadata in a clean card layout
- **Creatives gallery**: Grid of uploaded creatives with preview, click URL, dimensions
- **Lifecycle timeline**: Visual status history
- **Edit mode**: Inline editing with save/cancel

---

#### [NEW] Key Components

| Component | Purpose |
|-----------|---------|
| `CampaignStatusBadge.vue` | Color-coded status badge with icon |
| `CampaignCard.vue` | Card view alternative for campaign list |
| `CreativeUploader.vue` | Drag & drop file upload with OBS integration |
| `CreativePreview.vue` | Image/HTML preview with metadata |
| `StatusTransitionButton.vue` | Smart button that shows available next states |
| `CampaignFilters.vue` | Filter bar with status chips and search |
| `BulkActionToolbar.vue` | Toolbar for multi-select actions |
| `ConfirmDialog.vue` | Reusable confirmation modal |

---

### 6. Composables

#### [NEW] `app/composables/useCampaigns.ts`

Wraps `useFetch`/`useAsyncData` for campaign list with reactive filters, pagination, and search. Provides:
- `campaigns`, `total`, `loading`, `error`
- `refresh()`, `updateFilters()`, `changePage()`

#### [NEW] `app/composables/useCampaign.ts`

Single campaign CRUD operations:
- `fetchCampaign(id)`
- `createCampaign(data)`
- `updateCampaign(id, data)`
- `deleteCampaign(id)`
- `changeStatus(id, newStatus)`
- `cloneCampaign(id)`

#### [NEW] `app/composables/useCreativeUpload.ts`

File upload to OBS with progress tracking:
- `upload(file)` → returns CDN URL
- `progress`, `uploading`, `error`

---

### 7. Shared Types

#### [NEW] `shared/types/campaign.ts`

TypeScript types and Zod schemas shared between `app/` and `server/`:

```typescript
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type CampaignPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Campaign { ... }
export interface Creative { ... }
export interface CampaignListQuery { ... }
export interface CampaignListResponse { ... }

// Zod validation schemas
export const createCampaignSchema = z.object({ ... });
export const updateCampaignSchema = z.object({ ... });

// Valid status transitions map
export const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft:     ['scheduled', 'active'],
  scheduled: ['active', 'draft'],
  active:    ['paused', 'completed'],
  paused:    ['active', 'completed'],
  completed: [],  // terminal state — use clone to create new
};
```

---

## Resolved Questions

- **OBS Region** — Confirmed: `ap-southeast-3` (Singapore).
- **OBS Bucket Name** — Confirmed: `assets-oasis`. CDN: `https://assets-oasis.kgmedia.id`.

## PRD Cross-Reference

This implementation plan covers **Goal 1: Campaign Management (MVP)** from `docs/progress.md`, mapping to the following PRD sections:

| Implementation Section | PRD Section |
|----------------------|-------------|
| §2 Database Schema | §9 Data Model Summary (`campaigns`, `creatives`) |
| §3 Server Utilities — Redis | §5 Key Architectural Requirements (Redis sync for OASIS-DELIVERY) |
| §3 Server Utilities — OBS | §8.1.1 Campaign Creation (creative upload to Huawei OBS / S3) |
| §4 API Endpoints — CRUD | §8.1 Campaign Management |
| §4 API Endpoints — Status | §8.1.2 Campaign Lifecycle (status flow + Redis sync) |
| §4 API Endpoints — Bulk | §8.1.3 Campaign List & Overview (bulk actions) |
| §5 Frontend — Dashboard | §7.1 OASIS-DASHBOARD Tech Stack (Nuxt 4, Nuxt UI) |
| §6 Composables | §8.1 Campaign Management (data fetching for list/detail/create) |
| §7 Shared Types | §8.1.2 Campaign Lifecycle (status transitions) |

### Future Implementation Plans (not yet scoped)

| PRD Section | Goal |
|------------|------|
| §8.2 Customer Data Management | Goal 2: Customer Data Platform |
| §8.3 Attributes & Events | Goal 2: Customer Data Platform |
| §8.4 Ingest API | Goal 2: Customer Data Platform |
| §8.5 Journey Orchestration | Goal 3: Journey Orchestration |
| §8.6 Reporting & Data | Goal 4: Reporting & Analytics |
| §8.7 User & Account Management | Goal 5: User & Account Management |
| §8.8 API Settings | Goal 5: User & Account Management |
| §5 Architectural Requirements (OASIS-DELIVERY) | Goal 6: Delivery API |

---

## Verification Plan

### Automated Tests
1. **Docker services**: `docker compose up -d` → verify PostgreSQL and Redis are reachable
2. **Database migrations**: `npx drizzle-kit generate` + `npx drizzle-kit migrate` → verify tables created
3. **API smoke tests** (via browser or curl):
   - `POST /api/campaigns` — create a draft campaign
   - `GET /api/campaigns` — list returns the created campaign
   - `PATCH /api/campaigns/{id}/status` — activate → verify Redis key created
   - `PATCH /api/campaigns/{id}/status` — pause → verify Redis key removed
   - `POST /api/upload/creative` — upload file → verify CDN URL accessible
4. **Dev server**: `npm run dev` → verify dashboard loads with campaign list, create form works end-to-end

### Manual Verification
- Walk through the full campaign lifecycle in the browser: Create → Schedule → Activate → Pause → Resume → Complete
- Verify creative upload shows preview and CDN URL works
- Verify bulk actions (select multiple → pause/resume)
- Check responsive layout on mobile viewport
- Verify Redis data consistency via `redis-cli` inspection
