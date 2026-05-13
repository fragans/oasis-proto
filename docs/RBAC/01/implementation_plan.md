# Implementation Plan: URL-Based Organization Routing Strategy

This plan outlines the transition from session-based organization context to a **URL-based Routing Strategy** (`/[orgSlug]/...`). This approach ensures explicit context, supports multi-tab usage, and provides a clear path for new users.

## User Review Required

> [!IMPORTANT]
> This refactor involves moving almost all files in `app/pages/` into a new `app/pages/[org]/` directory. This is a significant structural change.
> 
> **Login Flow:**
> 1. Login -> middleware checks for organizations.
> 2. If 0 orgs: Redirect to `/initiate-organization`.
> 3. If >0 orgs: Redirect to `/organizations/select`.
> 4. Once selected: Redirect to `/[orgSlug]/campaigns/on-site-messages`.

## Proposed Changes

### 1. Directory Restructuring

To leverage Nuxt's file-based routing, we will move core dashboard pages under a dynamic `[org]` segment.

#### [MOVE]
- `app/pages/campaigns/*` -> `app/pages/[org]/campaigns/*`
- `app/pages/creatives/*` -> `app/pages/[org]/creatives/*`
- `app/pages/settings/*` -> `app/pages/[org]/settings/*`

### 2. New Infrastructure Pages

#### [NEW] [initiate-organization.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/initiate-organization.vue)
- **Target:** Super Admins only.
- Features a form to create the first organization in the system.

#### [NEW] [no-organization.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/no-organization.vue)
- **Target:** Regular Admins/Users.
- Displays a message: "You don't belong to any organization. Please contact your Super Admin for access."

#### [NEW] [select.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/organizations/select.vue)
- The "Organization Picker" page.
- **Implementation:** Built using `@nuxt/ui` v4 components for a premium look and feel.
- Lists all organizations the user has access to using `UCard` and `UButton`.
- When an organization is selected, it redirects to `/[selected-slug]/campaigns/on-site-messages`.

### 3. Middleware & Context Management

#### [MODIFY] [organization.global.ts](file:///Users/surya/kompas/oasis-dashboard/app/middleware/organization.global.ts)
- **Role:** Synchronize the URL `[org]` slug with the Better Auth `activeOrganizationId`.
- **Logic:**
    1. If `to.params.org` exists:
        - Verify user access to this slug.
        - If the slug is different from the current session's active org, call `setActive({ organizationSlug: to.params.org })`.
        - If the slug is invalid, redirect to `/organizations/select`.
    2. If `to.path === '/'`:
        - Fetch organization list.
        - Redirect to `/initiate-organization` (if 0 orgs) or `/organizations/select` (if >0 orgs).

#### [MODIFY] [Layouts & Navigation]
- Update `NavigationMenu` (in `default.vue`) and other components to dynamically inject the current org slug into all internal links.
- Example: `:to="\`/${orgSlug}/creatives\`"`

### 4. Super Admin Strategy
- Super Admins will follow the same flow as regular users. They must select an active organization context to view the dashboard, ensuring data is correctly filtered.

## Edge Case Analysis

| Edge Case | Scenario | Proposed Solution |
| :--- | :--- | :--- |
| **Zero Organizations** | User logs in but belongs to no orgs. | **Super Admin:** Redirect to `/initiate-organization`.<br>**Admin:** Redirect to `/no-organization`. |
| **Invalid Org Slug** | User types `/[wrong-slug]/campaigns` in the URL. | Middleware catches invalid slugs and redirects to the selection page. |
| **Multi-Tab Sync** | User has `Org A` in Tab 1 and `Org B` in Tab 2. | The URL segment preserves the context. Middleware ensures `setActive` is called whenever a tab is used. |
| **Switching Orgs** | User uses the Switcher to pick a new org. | The switcher will now trigger a `navigateTo` to the new URL path instead of just updating the session. |

## Verification Plan

### Manual Verification
1. **Empty User Flow:** Create a user, log in -> Verify redirect to `/initiate-organization`.
2. **Multi-Org User Flow:** Log in with user in 3 orgs -> Verify redirect to `/organizations/select`.
3. **Deep Linking:** Bookmark `/my-org/creatives`, logout, login -> Verify you are returned to that exact page after selection.
4. **Context Switching:** Manually change the URL from `/org-a/...` to `/org-b/...` -> Verify the session and UI update to `org-b`.
