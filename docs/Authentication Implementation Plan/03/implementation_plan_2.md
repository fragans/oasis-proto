# Fix Creative Picker and Remove Deprecated Organization Logic

The "Change Image" functionality in the campaign wizard is failing because it relies on a deprecated and undefined `defaultOrganizationId`. This plan outlines the steps to fix the image picker and complete the refactoring of all remaining legacy organization fallbacks.

## User Review Required

> [!IMPORTANT]
> - This change will remove all remaining references to `DEFAULT_ORGANIZATION_ID` in environment variables and the codebase.
> - Seeding logic in `server/plugins/migrations.ts` and `server/api/auth/seed.post.ts` will be updated or removed to align with the new organization management system.
> - The `/api/creatives` endpoint will now strictly require an organization context (either from the query or the session).

## Proposed Changes

### 1. Fix Creative Picker (Frontend)

#### [MODIFY] [CreativePickerModal.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/creative/CreativePickerModal.vue)
- Use `useUserSession` to get the `activeOrganizationId`.
- Update `useFetch` to watch and use `activeOrganizationId`.
- Trigger `refresh()` when the modal opens.

#### [MODIFY] [HtmlPreview.client.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/campaign/wizard/HtmlPreview.client.vue)
- Remove the display of `defaultOrganizationId` in the preview browser header.

### 2. Refactor API Endpoints (Backend)

#### [MODIFY] [index.get.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/creatives/index.get.ts)
- Use `getOrganizationId(event)` to resolve the organization context.
- Throw a `400 Bad Request` if no organization ID is provided/resolved.

#### [MODIFY] [id.put.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/campaigns/[id].put.ts)
- Remove `defaultOrganizationId` fallback in the KV sync logic.

#### [DELETE] [seed.post.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/auth/seed.post.ts)
- Remove this legacy seeding endpoint if it's no longer used for the current auth setup. (Or refactor to use a provided organization ID).

### 3. Cleanup Legacy Logic

#### [MODIFY] [migrations.ts](file:///Users/surya/kompas/oasis-dashboard/server/plugins/migrations.ts)
- Remove the automatic seeding of the "default organization" during migrations.

#### [MODIFY] [.env](file:///Users/surya/kompas/oasis-dashboard/.env), [.env.prod](file:///Users/surya/kompas/oasis-dashboard/.env.prod), [.env.staging](file:///Users/surya/kompas/oasis-dashboard/.env.staging)
- Remove `DEFAULT_ORGANIZATION_ID` environment variables.

## Verification Plan

### Automated Tests
- Run `npm run lint` to ensure no stale references remain.

### Manual Verification
1. Verify "Change Image" works in the wizard.
2. Verify `/creatives` page still works.
3. Verify campaign updates still trigger KV sync correctly.
4. Verify server starts without errors from the migration plugin.
