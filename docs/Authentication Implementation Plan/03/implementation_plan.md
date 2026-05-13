# Native Better Auth Migration Plan (Phased)

This plan outlines the complete transition from a custom/hybrid organization system to a 100% Native Better Auth architecture. The migration is divided into three phases to manage complexity and ensure stability.

## Phase 1: Backend Foundation & Protocol Cleanup
**Goal**: Secure the API and establish the Better Auth session as the single source of truth.

### [Component Name]

#### [MODIFY] [organization.ts](file:///Users/surya/kompas/oasis-dashboard/server/utils/organization.ts)
- Refactor `getOrganizationId` and `requireOrganizationId` to be async and only check `session.session.activeOrganizationId`.
- Remove legacy header (`x-oasis-organization`), cookie (`oasis_org_id`), and fallback (`DEFAULT_ORGANIZATION_ID`) logic.
- Refactor `isSuperAdmin` to rely strictly on `session.user.role`.

#### [MODIFY] [auth.config.ts](file:///Users/surya/kompas/oasis-dashboard/server/auth.config.ts)
- Add `apiKey()` and `admin()` plugins to the Better Auth configuration.

#### [MODIFY] API Routes (server/api/...)
- Audit and update all routes to `await` the refactored organization utilities.
- Remove manual organization overrides from query parameters or headers.

---

## Phase 2: Frontend Core & Context Management
**Goal**: Remove custom abstractions and transition the app logic to native reactive hooks.

### [Component Name]

#### [DELETE] [useOrganization.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useOrganization.ts)
- Remove the custom wrapper.

#### [DELETE] [organization-init.global.ts](file:///Users/surya/kompas/oasis-dashboard/app/middleware/organization-init.global.ts)
- Remove the global middleware.

#### [MODIFY] [OrganizationSwitcher.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/organization/OrganizationSwitcher.vue)
- Refactor to use native `client.organization` hooks for state and switching.

#### [MODIFY] [useCampaigns.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useCampaigns.ts) & [useWizardDraft.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useWizardDraft.ts)
- Remove manual construction of `x-oasis-*` headers.

#### [NEW] Post-Login Context Logic
- Implement logic in `login.vue` or a top-level layout to auto-select the first available organization if `activeOrganizationId` is null.

---

## Phase 3: Advanced Management & Admin Refactor
**Goal**: Finalize the migration of administrative tools and user management.

### [Component Name]

#### [MODIFY] [team.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/settings/team.vue)
- Refactor to use `client.admin.listUsers()` directly.
- Add "Invite Member" placeholder UI (marked "Soon").

#### [MODIFY] [CreateUserSlideover.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/user/CreateUserSlideover.vue)
- Enforce mandatory `organizationId` for marketer roles.
- Update backend (`index.post.ts`) to explicitly link users to organization memberships via `auth.api.addMember`.

#### [MODIFY] Token Management
- Refactor the API and UI to use the Better Auth `apiKey` plugin.
- [DELETE] Legacy `api_tokens` table and its associated logic.

---

## Verification Plan

### Automated Tests
- `npm run typecheck`: Ensure all broken references from deletions are resolved.
- Database Migrations: Verify `apiKey` and `member` tables are correctly initialized.

### Manual Verification
- **E2E Switching**: Verify organization switching reloads the app and correctly scopes data.
- **Role Isolation**: Verify Super Admins can still access global data if configured, while marketers are strictly scoped.
- **New User Flow**: Verify that newly created users have a valid organization context immediately.
