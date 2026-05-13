# Walkthrough: Creative Picker Fix & Legacy Cleanup

I have resolved the issue where images were not appearing in the campaign wizard and successfully removed all remaining references to the deprecated `defaultOrganizationId` system.

## Changes Made

### 1. Fixed Creative Picker (Frontend)
- **Updated [CreativePickerModal.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/creative/CreativePickerModal.vue)**: Switched from using a hardcoded/undefined `defaultOrganizationId` to the reactive `activeOrganizationId` from the user session.
- **Improved Data Fetching**: Migrated from `useAsyncData` to `useFetch` with a watcher on the active organization, ensuring images refresh correctly when switching organizations.
- **UI Cleanup**: Removed the deprecated display of `defaultOrganizationId` in the **[HtmlPreview.client.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/campaign/wizard/HtmlPreview.client.vue)** browser header.

### 2. Secured & Cleaned Up Backend
- **Refactored [index.get.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/creatives/index.get.ts)**: The creatives API now uses `getOrganizationId(event)` to resolve context and throws a `400 Bad Request` if no organization is found, preventing the database parameter failure ($1 missing).
- **Cleaned Up [id.put.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/campaigns/[id].put.ts)**: Removed legacy fallbacks in the KV synchronization logic.
- **Deleted [seed.post.ts](file:///Users/surya/kompas/oasis-dashboard/server/api/auth/seed.post.ts)**: Removed the deprecated programmatic seeding endpoint.
- **Updated [migrations.ts](file:///Users/surya/kompas/oasis-dashboard/server/plugins/migrations.ts)**: Removed the automatic seeding of the "default organization" during startup.

### 3. Environment Variable Cleanup
- Removed `DEFAULT_ORGANIZATION_ID` from `.env`, `.env.prod`, and `.env.staging` files.

## Verification Results

### Automated Tests
- **Linting**: Successfully ran `npm run lint` and fixed unused imports in the migration plugin.

### Manual Verification Required
- [ ] **Verify Image Picker**: Go to the campaign wizard, select "Modal with CTA Redirect", and click "Change Image". You should now see the image assets from your `/creatives` gallery.
- [ ] **Verify Organization Switching**: Ensure that if you switch organizations, the picker updates its content accordingly.
