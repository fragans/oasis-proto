# Authentication Implementation Plan (Better Auth + Nuxt UI)

Based on the decision to balance minimal effort with modularity for scaling (like future multi-tenancy or SSO), we will implement authentication using `@onmax/nuxt-better-auth`. This modern framework handles the heavy lifting (password hashing, sessions, DB queries) while remaining highly modular through its plugin system.

We will leverage **Nuxt UI v4** to build a premium, accessible authentication UI that matches the existing dashboard aesthetics.

## Goal
Implement a robust, scalable, and secure session-based authentication system using `better-auth` backed by our existing PostgreSQL database and Drizzle ORM, with a polished UI powered by Nuxt UI.

## User Review Required

> [!IMPORTANT]
> **Database Schema Generation** — `better-auth` requires 4 standard tables (`user`, `session`, `account`, `verification`). We will use the `@better-auth/drizzle-adapter` to connect Better Auth to your existing Postgres DB. We will add `role` and `organizationId` as `additionalFields` to the `user` table so it perfectly matches your multi-tenant needs without writing custom schemas.

> [!WARNING]
> **User Creation (MVP)** — Since this is an internal tool, we will skip the complex email invitation workflow from the PRD for now. Instead, we will use a secure backend script to create the first Super Admin user, and then build a simple "Create User" admin page later.

## Proposed Changes

### 1. Dependencies & Foundation

#### [MODIFY] package.json
Install the Nuxt Better Auth module, core library, and the specific Drizzle adapter package.
```bash
npm install @onmax/nuxt-better-auth better-auth @better-auth/drizzle-adapter
```

#### [MODIFY] app/app.vue
Ensure the entire application is wrapped in `<UApp>` as required by Nuxt UI v4 for toasts and overlays.

### 2. Configuration & Integration

#### [MODIFY] nuxt.config.ts
Register the module.

#### [NEW] server/auth.config.ts
Configure Better Auth to use email/password and connect to our existing Drizzle Postgres setup using the dedicated adapter package.
```typescript
import { defineServerAuth } from '#auth/server'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from './utils/drizzle'

export default defineServerAuth(() => ({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'viewer' },
      organizationId: { type: 'string', required: false }
    }
  }
}))
```

### 3. Database Migrations

#### [TERMINAL COMMAND]
We will use the `@better-auth/cli` to generate the Drizzle schema and then apply it using `drizzle-kit`:
```bash
npx @better-auth/cli generate
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 4. Middleware & Protection

#### [MODIFY] nuxt.config.ts
Protect dashboard routes using `routeRules` and ensure `BETTER_AUTH_URL` is configured in `.env`.

### 5. Frontend UI (Nuxt UI v4)

#### [NEW] app/pages/login.vue
A centered login card using Nuxt UI's form system and `useToast` for feedback.

### 6. Admin Seeding

#### [NEW] server/api/auth/seed.post.ts
An endpoint protected by `MASTER_KEY` to seed the first `super_admin`.

## Edge Case Planning

### 1. Session Expiry & Invalidation
- **Problem**: User's session expires while they are actively viewing a dashboard page.
- **Solution**: Implement a global client-side error interceptor that detects `401 Unauthorized` responses from the API and triggers a redirect to `/login?reason=expired`.

### 2. Cross-Organization Security (Authorization)
- **Problem**: A user authenticated for `Org A` manually changes the URL to access a resource belonging to `Org B`.
- **Solution**: Create a server utility `verifyOrgAccess(event, orgId)` that is called in every scoped API handler.

### 3. Missing Organization Assignment
- **Problem**: A newly created Super Admin might not have an `organizationId` assigned initially.
- **Solution**: The dashboard layout should detect a missing `organizationId` and prompt the user to create or join an organization.

### 4. Database Availability
- **Problem**: The PostgreSQL database is down or unreachable during an auth check.
- **Solution**: Catch DB connection errors in `server/auth.config.ts` and return a generic `503 Service Unavailable`.

### 5. Multi-Tab Logout
- **Problem**: User logs out in Tab A; Tab B remains open and looks authenticated.
- **Solution**: Use `useUserSession().clear()` and configure Better Auth client-side listener.

## Verification Plan

### Automated/Local Tests
- Run `npx @better-auth/cli generate` and verify the output.
- Verify unauthenticated redirect to `/login`.

### Manual Verification
- Seed the initial admin user.
- Log in and verify the `useToast` feedback.
- Verify the session cookie and database `session` record.
