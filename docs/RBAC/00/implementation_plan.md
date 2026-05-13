# RBAC Refactor: Campaign & On-Site Messages

This plan outlines the necessary refactors to align the Campaign and On-Site Message modules with the defined RBAC permissions for `super_admin`, `admin`, and `viewer` roles.

## User Review Required

> [!IMPORTANT]
> The `viewer` role is strictly read-only. This plan will hide all mutation UI (checkboxes, action buttons, wizard access) for users with this role.

> [!NOTE]
> We are adding individual campaign status controls (Launch, Pause, etc.) to the `DetailDrawer`, which were previously only available via bulk actions.

## Proposed Changes

### [Core]

#### [NEW] [useRole.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useRole.ts)
Create a centralized composable to handle role and permission checks. This makes the code more maintainable and DRY.
- `isAdmin`: returns true for `admin` or `super_admin`.
- `isSuperAdmin`: returns true for `super_admin`.
- `isViewer`: returns true for `viewer`.

#### [NEW] [admin.ts](file:///Users/surya/kompas/oasis-dashboard/app/middleware/admin.ts)
Create an `admin` middleware (similar to `super_admin.ts`) that allows both `admin` and `super_admin` but blocks `viewer`.

---

### [Campaigns]

#### [MODIFY] [index.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/index.vue)
- Use the new `useRole` composable.
- Dynamically remove the `select` column from the `columns` array if the user is a `viewer`.
- Hide bulk selection checkboxes in the table header and rows for `viewer`.
- Ensure all action buttons are consistently guarded by `isAdmin`.

#### [MODIFY] [DetailDrawer.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/campaign/DetailDrawer.vue)
- Use `useRole` composable.
- Add status control buttons (Launch, Pause, Resume, Archive) in the footer, guarded by `isAdmin`.
- These buttons will call the existing campaign status mutation logic.

#### [MODIFY] Wizard Pages
Apply the `admin` middleware to all wizard pages to prevent manual URL access by `viewer` users.
- [template.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/%5Bid%5D/wizard/template.vue)
- [target.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/%5Bid%5D/wizard/target.vue)
- [trigger.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/%5Bid%5D/wizard/trigger.vue)
- [goal.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/%5Bid%5D/wizard/goal.vue)
- [launch.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/campaigns/on-site-messages/%5Bid%5D/wizard/launch.vue)

---

### [Settings]

#### [MODIFY] [create.vue](file:///Users/surya/kompas/oasis-dashboard/app/pages/settings/organizations/create.vue)
Fix the middleware name from `super-admin` to `super_admin` to match the filename and maintain consistency.

## Verification Plan

### Automated Tests
- No automated tests currently exist for RBAC UI, but we can verify manually via the browser tool if needed (though session switching might be complex).

### Manual Verification
1. **Login as Viewer**:
   - Verify "New Message" button is hidden.
   - Verify table has no checkboxes and no `select` column.
   - Verify campaign names are NOT clickable.
   - Verify action menu only contains "Details".
   - Verify `DetailDrawer` has no action buttons.
   - Attempt to manually navigate to a wizard URL and verify redirection.
2. **Login as Admin**:
   - Verify all mutation buttons are visible.
   - Verify `DetailDrawer` now has status control buttons.
   - Verify wizard access is allowed.
3. **Login as Super Admin**:
   - Verify global access and all Admin capabilities.
