# Integrate Better Auth Organizations

The goal is to replace the custom, manual organization logic with the official Better Auth Organization plugin. This will provide robust multi-tenancy, standard roles, invitations, and secure session-scoped active organization state.

## User Review Required

> [!WARNING]
> **Database Schema Changes**
> This integration will introduce new tables (`organization`, `member`, `invitation`). We will need to run Drizzle migrations.

> [!IMPORTANT]
> **Data Migration**
> Existing data from the `organizations` table and user `organizationId` relationships will need to be migrated to the new schema. A migration script will be required to ensure no data is lost and existing users maintain their access.

## Open Questions

> [!CAUTION]
> **Schema Mapping & Naming**
> 1. Your current table is named `organizations` (plural) with an `id` that acts like a slug (e.g., `'kompasid'`). Better Auth defaults to a table named `organization` (singular) with generated UUIDs and a separate `slug` field. 
>    - **Question 1**: Should we let Better Auth use its default `organization` table and map your old `id` to the new `slug`? (Recommended)
>    - **Question 2**: Once migrated, is it safe to drop the old `organizations` table and the `organizationId` column on the `user` table?

> [!IMPORTANT]
> **Super Admin Logic**
> Your current logic treats Super Admins differently (they don't belong to a specific org and can switch freely). Better Auth's `admin` plugin (already enabled) handles global admin rights, but for organizations, we need to decide if Super Admins should be implicitly added to all organizations as `owner`s or if they should bypass organization scoping entirely.
>    - **Question 3**: Should Super Admins continue to bypass organization restrictions globally, or should they be explicitly assigned to organizations?

## Proposed Changes

---

### Phase 1: Authentication Configuration

#### [MODIFY] [server/auth.config.ts](file:///Users/surya/kompas/oasis-dashboard/server/auth.config.ts)
- Import and enable the `organization` plugin.
- Configure `additionalFields` for the `organization` schema to retain your custom columns (`hostname`, `cookieName`, `apiUrl`, `authCookieNames`, `isLive`).

#### [MODIFY] [app/auth.config.ts](file:///Users/surya/kompas/oasis-dashboard/app/auth.config.ts)
- Import and enable the `organizationClient` plugin.

---

### Phase 2: Database Schema Updates

#### [MODIFY] [server/database/schema.ts](file:///Users/surya/kompas/oasis-dashboard/server/database/schema.ts)
- Add the new `organization`, `member`, and `invitation` table definitions required by Better Auth.
- Update relationship mappings (e.g., campaigns referencing the new organization table).

#### [NEW] Migration Script
- Create a server API endpoint or CLI script to safely migrate existing data:
  1. Copy records from `organizations` to `organization`.
  2. Create `member` records for all users based on their existing `user.organizationId`, assigning them the `owner` or `admin` role.

---

### Phase 3: Composable & Middleware Refactoring

#### [MODIFY] [app/composables/useOrganization.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useOrganization.ts)
- Replace manual cookie management and custom API calls.
- Use `authClient.organization.useActiveOrganization()` and `authClient.organization.useListOrganizations()`.
- Update `switchOrganization` to use `authClient.organization.setActive()`.

#### [MODIFY] [server/utils/organization.ts](file:///Users/surya/kompas/oasis-dashboard/server/utils/organization.ts)
- Update `getOrganizationId` to extract the active organization from the Better Auth session context instead of relying solely on the `x-oasis-organization` header or cookie.

---

### Phase 4: UI & API Updates

#### [MODIFY] [app/components/organization/OrganizationSwitcher.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/organization/OrganizationSwitcher.vue)
- Update component to reactively consume the new `useOrganization` state without requiring full page reloads.

#### [MODIFY] [server/api/v1/users/index.post.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/v1/users/index.post.ts)
- Update user creation logic to use Better Auth's `admin` or `organization` APIs to properly associate new users as members of the correct organization.

## Verification Plan

### Automated/Manual Testing
1. **Schema Validation**: Run `drizzle-kit generate` and ensure migrations apply without conflict.
2. **Data Migration**: Run the migration script locally and verify records are populated in the new `organization` and `member` tables.
3. **Session State**: Log in, observe the active organization in the UI, switch organizations, and ensure API requests correctly scope to the newly active organization.
4. **Access Control**: Verify that standard users only see data for their assigned organizations.
