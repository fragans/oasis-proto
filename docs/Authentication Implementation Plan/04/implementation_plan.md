# Implementation Plan - Refactoring Better Auth Integration


This plan outlines the steps to remove the `@onmax/nuxt-better-auth` library and replace it with a custom, more robust implementation directly using `better-auth` and `better-auth/client`.

## skill for plan
- npx skills add better-auth/skills
- https://github.com/better-auth/skills/blob/main/better-auth/organization/SKILL.md
- /nuxt4-patterns
- /nuxt

## official doc for better-auth plugins
- ./docs/Authentication Implementation Plan/better-auth/*

## User Review Required

> [!IMPORTANT]
> The library `@onmax/nuxt-better-auth` handles Nuxt-specific integrations like route middleware via `routeRules` and auto-imports for `useUserSession`. We will replace these with native Nuxt patterns.

## Proposed Changes

### Component & Composable Refactoring

#### [MODIFY] Various Files
Replace usages of `useUserSession()` with the new custom composable.
- `app/layouts/default.vue`: Auth state and logout.
- `app/pages/login.vue`: SignIn functionality.
- `app/pages/creatives/index.vue`: Organization session access.
- `app/pages/settings/index.vue`: User profile access.
- `app/pages/settings/team.vue`: Admin client access.
- `app/pages/settings/api.vue`: API key management.
- `app/components/organization/OrganizationSwitcher.vue`: Organization switching logic.
- `app/components/user/CreateUserSlideover.vue`: Organization listing via client.
- `app/components/campaign/OsmCreateNameModal.vue`: Organization session access.
- `app/composables/useCampaigns.ts`: Filtering by organization ID.
- `app/composables/useWizardDraft.ts`: Draft persistence context.
- `app/middleware/super-admin.ts`: Role-based protection logic.

---

### Server-side Implementation

#### [NEW] [auth.ts](file:///Users/surya/kompas/oasis-dashboard/server/utils/auth.ts)
Initialize `betterAuth` with the configuration currently in `server/auth.config.ts`.
- Use `useDB()` for the database connection.
- Include plugins: `admin`, `apiKey`, `organization`.
- Export the `auth` instance.

#### [NEW] [[...all].ts](file:///Users/surya/kompas/oasis-dashboard/server/api/auth/[...all].ts)
Create the auth handler to catch all `/api/auth/*` requests and pass them to `auth.handler`.

#### [MODIFY] Server Utilities & Endpoints
Refactor code that currently uses library-provided auto-imports (`serverAuth`, `requireUserSession`):
- `server/utils/organization.ts`: Update `getOrganizationId` and `requireOrganizationId` to use the native `auth` instance.
- `server/api/auth/seed.post.ts`: Update to use the native `auth.api`.
- `server/api/v1/users/index.post.ts`: Replace `requireUserSession` with a custom server-side check and update `serverAuth`.

#### [DELETE] [auth.config.ts](file:///Users/surya/kompas/oasis-dashboard/server/auth.config.ts)
Remove the old configuration file.

---

### Client-side Implementation

#### [NEW] [auth-client.ts](file:///Users/surya/kompas/oasis-dashboard/app/utils/auth-client.ts)
Initialize the better-auth client using `createAuthClient` with configuration from `app/auth.config.ts`.
- Include plugins: `adminClient`, `organizationClient`, `apiKeyClient`.

#### [NEW] [useAuth.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useAuth.ts)
Create a custom composable that provides:
- `user`, `session` (using `authClient.useSession()`).
- `client` (the `authClient` instance).
- Helpers for `signIn`, `signOut`, etc.

#### [DELETE] [auth.config.ts](file:///Users/surya/kompas/oasis-dashboard/app/auth.config.ts)
Remove the old configuration file.

---

### Nuxt Integration

#### [NEW] [auth.global.ts](file:///Users/surya/kompas/oasis-dashboard/app/middleware/auth.global.ts)
Implement route protection logic that respects the `auth` property in `definePageMeta` (mimicking the behavior of `routeRules` but more flexible).
- Handle `auth: 'user'` and `auth: 'guest'`.

#### [MODIFY] [nuxt.config.ts](file:///Users/surya/kompas/oasis-dashboard/nuxt.config.ts)
- Remove `@onmax/nuxt-better-auth` from `modules`.
- Clean up `routeRules` if we move auth logic to middleware (or keep them if we can implement a custom handler for them).
- Update `vite.optimizeDeps` if needed.

#### [MODIFY] [auth.d.ts](file:///Users/surya/kompas/oasis-dashboard/app/types/auth.d.ts)
Update type augmentations to refer to `better-auth` directly instead of `@onmax/nuxt-better-auth`.

---

### Cleanup

#### [MODIFY] [package.json](file:///Users/surya/kompas/oasis-dashboard/package.json)
Remove `@onmax/nuxt-better-auth`.

## Verification Plan

### Automated Tests
- Run `npm run typecheck` to ensure all type augmentations and composable usages are correct.
- Manual verification of the login flow.

### Manual Verification
1.  **Login**: Verify that email/password login still works.
2.  **Session**: Verify that the user session is correctly restored on page reload.
3.  **Organizations**: Verify that switching organizations still works and updates the session state.
4.  **Route Protection**: Verify that protected routes (e.g., `/campaigns`) redirect to `/login` when unauthenticated.
5.  **Super Admin**: Verify that super admin role checks still work.


