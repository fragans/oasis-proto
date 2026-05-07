# Plan: Organization Switcher for Super Admins

## Summary
Implement a global UI component that allows Super Admins to switch their active organization context. This involves adding cookie-based persistence for the selected organization and a dropdown switcher in the main layout.

## User Story
As a Super Admin, I want to quickly switch between different organizations (e.g., `kompascom`, `kompasid`) so that I can manage their respective campaigns and settings without re-logging or changing browser headers manually.

## Problem → Solution
- **Current state**: The active organization is determined by the `x-oasis-organization` header or a static `defaultOrganizationId` in `runtimeConfig`. Super Admins have no UI to switch context.
- **Desired state**: Super Admins see a dropdown in the header. Selecting an organization saves the choice to a cookie, which is then used by the backend to set the active organization context.

---

## UX Design

### Interaction
- The switcher appears in the top-right of the header (replacing or next to the static Org ID).
- user with multiple organizations can switch between organizations.
- user without multiple organizations can see the static Org ID.
- in super-admin mode this will be always visible
- Clicking an organization in the list updates the context and refreshes the page/data.

---

## Technical Strategy

### 1. Persistence Layer
- Use a cookie named `oasis_org_id` to store the selected organization ID.
- This ensures the preference persists across sessions and is accessible to both SSR and client-side requests.

### 2. Backend Resolution (`server/utils/organization.ts`)
- Update `getOrganizationId` to follow this priority:
  1. `x-oasis-organization` header (highest priority, for manual overrides/API).
  2. `oasis_org_id` cookie.
  3. `defaultOrganizationId` from config (fallback).

### 3. Frontend State (`useOrganization` composable)
- Manage the list of organizations (fetched from `/api/organizations`).
- Manage the `activeOrganizationId` (linked to the cookie).
- Provide a `switchOrganization` method.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `server/utils/organization.ts` | UPDATE | Support resolving organization ID from cookies. |
| `app/composables/useOrganization.ts` | [NEW] | Manage organization state and switching logic. |
| `app/components/organization/OrganizationSwitcher.vue` | [NEW] | Dropdown UI component for organization selection. |
| `app/layouts/default.vue` | UPDATE | Integrate the switcher into the global header. |

---

## Step-by-Step Tasks

### Task 1: Update Backend Resolution
- **ACTION**: Modify `getOrganizationId` in `server/utils/organization.ts`.
- **IMPLEMENT**:
  ```typescript
  export const getOrganizationId = (event: H3Event): string | null => {
    // 1. Check Header
    const orgHeader = getHeader(event, 'x-oasis-organization')
    if (orgHeader) return orgHeader

    // 2. Check Cookie
    const orgCookie = getCookie(event, 'oasis_org_id')
    if (orgCookie) return orgCookie

    // 3. Fallback to Super Admin logic or Default
    if (isSuperAdmin(event)) return null
    return useRuntimeConfig().public.defaultOrganizationId
  }
  ```

### Task 2: Create `useOrganization` Composable
- **ACTION**: Create `app/composables/useOrganization.ts`.
- **IMPLEMENT**:
  - Fetch organizations using `useAsyncData` from `/api/organizations`.
  - Use `useCookie('oasis_org_id')` for persistence.
  - Expose `currentOrganization` (the full object) and `allOrganizations`.

### Task 3: Build Switcher Component
- **ACTION**: Create `app/components/organization/OrganizationSwitcher.vue`.
- **IMPLEMENT**:
  - Use `USelectMenu` for the dropdown.
  - Display the current organization's name or ID.
  - On change, update the cookie and trigger a full page refresh (or use `refreshNuxtData`) to ensure all organization-scoped data is re-fetched.

### Task 4: Integrate into Layout
- **ACTION**: Update `app/layouts/default.vue`.
- **IMPLEMENT**:
  - Detect Super Admin status (via a prop or shared state).
  - Conditionally render `<OrganizationSwitcher />` in the header.

---

## Testing Strategy
1. **Header Override**: Verify that sending `x-oasis-organization` header still works and takes priority over the cookie.
2. **Cookie Persistence**: Select an organization, refresh the page, and verify the choice is remembered.
3. **Super Admin Visibility**: Verify the switcher is hidden if the `x-oasis-super-admin` header is missing.
4. **Data Isolation**: Switch from Org A to Org B and verify that campaign lists and settings update correctly.

---

## Decisions & Refinements
- **Default Selection**: If no cookie is set, default to the first organization in the returned list.
- **Switch Logic**: Perform a full `window.location.reload()` on organization switch to ensure absolute data isolation and clean state.
- **Visibility**:
    - **Super Admins**: Switcher is **always** visible and contains all organizations.
    - **Multi-Org Users**: Switcher is visible and contains only their permitted organizations.
    - **Single-Org Users**: Switcher is hidden; static ID is shown.

---

## Step-by-Step Tasks

### Task 1: Update Backend Resolution
- **ACTION**: Modify `getOrganizationId` in `server/utils/organization.ts`.
- **IMPLEMENT**:
  - Check `x-oasis-organization` header.
  - Check `oasis_org_id` cookie.
  - Fallback to `defaultOrganizationId`.

### Task 2: Create `useOrganization` Composable
- **ACTION**: Create `app/composables/useOrganization.ts`.
- **IMPLEMENT**:
  - Fetch organizations via `/api/organizations`.
  - Use `useCookie('oasis_org_id')`.
  - Add logic to set the cookie to the first organization's ID if it's empty and organizations are available.
  - Expose `currentOrganization`, `allOrganizations`, and `isSuperAdmin` (checking headers).

### Task 3: Build Switcher Component
- **ACTION**: Create `app/components/organization/OrganizationSwitcher.vue`.
- **IMPLEMENT**:
  - Use `USelectMenu`.
  - On change, set the cookie and call `window.location.reload()`.
  - Handle the "Single Org" vs "Multi Org" display logic.

### Task 4: Integrate into Layout
- **ACTION**: Update `app/layouts/default.vue`.
- **IMPLEMENT**:
  - Replace static ID display with `<OrganizationSwitcher />`.

