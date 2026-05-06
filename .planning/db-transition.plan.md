# Goal: Database Transition to Oasis v2

The project is moving from a "showcase" Neon database to a fresh, dedicated database on the Huawei Cloud server. This replaces the old PHP-based dashboard with a fresh start while keeping legacy data safe.

## Decisions Made
- **New Database**: Use `oasis_v2` for the new Nuxt project.
- **Fresh Start**: No data migration from the legacy PHP dashboard.
- **Legacy Safety**: The old `staging_oasisdb` and `oasisdb` remain untouched for reference.

## Proposed Changes

### 1. Database Creation (Manual Task)
Before proceeding, the `oasis_v2` database must be created on the Huawei Cloud server (`172.18.64.143`).
```sql
-- Use your root credentials or an admin tool to run:
CREATE DATABASE oasis_v2;
```

### 2. Configure Local Environment
Update your `.env` file to point to the new database using the credentials from `.env.old-oasis`.

**[MODIFY] [.env](file:///Users/surya/kompas/oasis-dashboard/.env)**
```env
# Database (Huawei Cloud - New Fresh DB)
DATABASE_URL=postgresql://oasis_app:P4lm_Tr33@172.18.64.143:5432/oasis_v2
```

### 3. Initialize Schema
The migrations have been "squashed" into a single fresh initial migration (`0000_init_oasis_v2.sql`). 
Push the Nuxt application schema to the new database.
```bash
npx drizzle-kit push
```

### 4. Seed Initial Data (Important)
Since the database is fresh, you must seed the default organization for the app to function.
Run this SQL on the new `oasis_v2` database:
```sql
INSERT INTO organizations (id, hostname, cookie_name, api_url, is_live) 
VALUES ('kompasid', 'www.kompas.id', 'oasis_guid', 'https://oasis.kgmedia.id', true);
```

## Verification Plan

### Automated Verification
- **Connection Test**: Run `npx drizzle-kit push` to ensure the credentials work and the schema is synced.
- **App Health**: Start `npm run dev` and verify the dashboard loads.

### Manual Verification
- **Check Organizations**: Verify that `kompasid` organization appears in the dashboard.
- **Database GUI**: Use a database GUI (DBeaver/TablePlus) to confirm that the `oasis_v2` database contains the new Nuxt tables.
