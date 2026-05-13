# RBAC Refactor Walkthrough

I have implemented the RBAC refactor plan to ensure that `super_admin`, `admin`, and `viewer` roles have appropriate access and UI visibility, specifically in the Campaign and Settings modules.

## Changes Made

### 1. Centralized Role Logic
Created a new composable `useRole.ts` to centralize all role-based checks. This ensures consistency and makes it easy to update permissions in the future.
- [useRole.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useRole.ts)

### 2. Route Protection (Middleware)
- Created `admin.ts` middleware to protect routes that require mutation permissions.
- Applied `admin` middleware to all Campaign Wizard steps and the Team Management page.
- Applied `super_admin` middleware to the General Settings page.
- Fixed a naming inconsistency in the Organization Creation page.

### 3. Campaign List Refinement
- The Campaign List table now dynamically hides the selection column and bulk action checkboxes for users with the `viewer` role.
- Campaign names are no longer clickable links for `viewer` users (since they cannot edit).

### 4. Detail Drawer Enhancements
- Added status control buttons (Launch, Pause, Resume, Archive) to the `DetailDrawer` for `admin` and `super_admin` users.
- These buttons are hidden for `viewer` users, and valid transitions are automatically calculated based on the current campaign status.

## Files Modified

| Component | Files |
| :--- | :--- |
| **Core** | [useRole.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useRole.ts), [admin.ts](file:///Users/surya/kompas/oasis-dashboard/app/middleware/admin.ts) |
| **Campaigns** | [index.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/index.vue), [DetailDrawer.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/campaign/DetailDrawer.vue) |
| **Wizard** | All pages in `/campaigns/on-site-messages/[id]/wizard/` |
| **Settings** | [index.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/settings/index.vue), [team.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/settings/team.vue), [create.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/settings/organizations/create.vue) |

## Verification Results
- **Viewer**: UI is clean and strictly read-only. Navigation to protected pages is blocked by middleware.
- **Admin**: Full access to organizational resources, including new status controls in the Detail Drawer.
- **Super Admin**: Global access to all organizations and settings.
