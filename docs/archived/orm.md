# ORM — Drizzle ORM with PostgreSQL

OASIS uses [Drizzle ORM](https://orm.drizzle.team/) with the `postgres` driver for all database access. Drizzle is a TypeScript-first, schema-as-code ORM with zero-abstraction SQL and a built-in migration CLI (Drizzle Kit).

---

## Stack

| Tool | Purpose |
|---|---|
| `drizzle-orm` | Query builder + type-safe ORM |
| `postgres` | PostgreSQL driver (used by Drizzle) |
| `drizzle-kit` | CLI for generating and running migrations |

---

## Configuration

**`drizzle.config.ts`** (project root)

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

---

## Connection Singleton

**`server/utils/drizzle.ts`**

A single DB connection is created at server startup and reused across all requests.

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

Usage in any Nitro handler:

```typescript
const db = useDB()
```

---

## Schema

Defined in **`server/database/schema.ts`**.

### Enums

```typescript
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
])

export const campaignPriorityEnum = pgEnum('campaign_priority', [
  'low',
  'medium',
  'high',
  'critical',
])
```

### `campaigns`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `name` | `varchar(255)` | Required |
| `description` | `text` | Optional |
| `objective` | `varchar(255)` | Optional |
| `status` | `campaign_status` enum | Default: `draft` |
| `priority` | `campaign_priority` enum | Default: `medium` |
| `start_date` | `timestamptz` | Optional |
| `end_date` | `timestamptz` | Optional |
| `created_at` | `timestamptz` | Auto-set on insert |
| `updated_at` | `timestamptz` | Must be updated manually on writes |

### `creatives`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `campaign_id` | `uuid` | FK → `campaigns.id` (cascade delete) |
| `type` | `varchar(50)` | `image` \| `html` \| `rich_media` |
| `file_url` | `text` | CDN URL (`https://assets-oasis.kgmedia.id/...`) |
| `file_name` | `varchar(255)` | Original filename |
| `file_size` | `integer` | Bytes |
| `mime_type` | `varchar(100)` | e.g. `image/png` |
| `click_url` | `text` | Optional click-through URL |
| `alt_text` | `varchar(500)` | Optional |
| `width` | `integer` | Pixels |
| `height` | `integer` | Pixels |
| `sort_order` | `integer` | Default: `0` |
| `created_at` | `timestamptz` | Auto-set on insert |

---

## Migrations

Migrations are generated and applied using Drizzle Kit.

### Generate a migration

After changing `schema.ts`, run:

```bash
npx drizzle-kit generate
```

This outputs a new `.sql` file to `server/database/migrations/`.

### Apply migrations

```bash
npx drizzle-kit migrate
```

Or programmatically on server startup (`server/plugins/migrations.ts`):

```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator'

export default defineNitroPlugin(async () => {
  const db = useDB()
  await migrate(db, { migrationsFolder: './server/database/migrations' })
})
```

### Other useful commands

```bash
npx drizzle-kit studio   # Open Drizzle Studio (visual DB browser)
npx drizzle-kit push     # Push schema diff directly (dev only, skips migration files)
npx drizzle-kit check    # Check for schema drift
```

---

## Common Query Patterns

### List campaigns with filters

```typescript
import { eq, ilike, and } from 'drizzle-orm'
import { campaigns } from '../database/schema'

const db = useDB()

const rows = await db
  .select()
  .from(campaigns)
  .where(
    and(
      eq(campaigns.status, 'active'),
      ilike(campaigns.name, '%summer%'),
    )
  )
  .orderBy(campaigns.createdAt)
  .limit(20)
  .offset(0)
```

### Get campaign with creatives

```typescript
const result = await db.query.campaigns.findFirst({
  where: eq(campaigns.id, id),
  with: { creatives: true },
})
```

### Insert a campaign

```typescript
const [campaign] = await db
  .insert(campaigns)
  .values({
    name: 'Summer Sale',
    priority: 'high',
  })
  .returning()
```

### Update status + updatedAt

```typescript
await db
  .update(campaigns)
  .set({ status: 'active', updatedAt: new Date() })
  .where(eq(campaigns.id, id))
```

### Delete a campaign (cascades to creatives)

```typescript
await db.delete(campaigns).where(eq(campaigns.id, id))
```

---

## File Locations

```
oasis-proto/
├── drizzle.config.ts                    # Drizzle Kit config
├── server/
│   ├── database/
│   │   ├── schema.ts                    # Table + enum definitions
│   │   └── migrations/                  # Generated SQL migration files
│   └── utils/
│       └── drizzle.ts                   # DB connection singleton (useDB)
```
