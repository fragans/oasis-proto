# User Settings & Team Management Implementation Plan

This plan outlines the creation of a "User Settings" (Team Management) page for Super Admins. The page will allow Super Admins to view all registered users, create new users, and assign users to specific organizations.

## Feedback Addressed

1. **OrganizationSwitcher**: No, this won't refactor `OrganizationSwitcher`. `OrganizationSwitcher` is used to change the active organization context for the user. We will just reuse the existing `/api/organizations` endpoint to populate the organization dropdown in the Create User form.
2. **Admin Plugin**: We will enable and use the Better Auth **Admin Plugin** to handle user creation and listing.
3. **Password**: We will generate a default password `kompas2026` for newly created users and display it to the admin upon creation.
4. **Access Control**: Yes, we will restrict the `/settings/team` page and the corresponding API endpoints so that **only** users with the `super-admin` role can access them.

---

## Proposed Changes

### Backend Configuration (Better Auth)

#### [MODIFY] `server/auth.config.ts`
- Import and enable the `admin()` plugin from `@better-auth/admin/plugins`.
- Configure the admin plugin to check for the `super-admin` role.

#### [MODIFY] `app/auth.config.ts`
- Import and enable the `adminClient()` plugin from `@better-auth/admin/client`.

---

### Backend API

#### [NEW] `server/api/v1/users/index.get.ts`
- Although the Admin plugin provides `listUsers`, we still need to join with the `organizations` table to display the organization name in the UI. 
- We will create this custom endpoint to fetch users + organization names.
- Enforce `super-admin` role check.

#### [NEW] `server/api/v1/users/index.post.ts`
- Endpoint to create a new user and assign `organizationId`.
- Enforce `super-admin` role check.
- Uses `auth.api.adminCreateUser()` or `auth.api.signUpEmail()` to create the user with the default password `"kompas2026"`.
- We use a custom endpoint instead of the raw admin plugin endpoint because we need to easily assign the `organizationId` custom field during creation.

---

### Frontend UI

#### [NEW] `app/pages/settings/team.vue`
- The main Team Management page UI.
- Use `definePageMeta({ auth: { user: { role: 'super-admin' } } })` to restrict access.
- Use `<UCard>` for layout.
- Use `<UTable>` to display the list of users (columns: Name, Email, Role, Organization, Joined Date).
- Include a "Create User" button at the top right.

#### [NEW] `app/components/user/CreateUserSlideover.vue`
- A Slideover or Modal form using `<USlideover>` / `<UModal>` and `<UForm>`.
- Fields:
  - Email (`<UInput type="email">`)
  - Name (`<UInput>`)
  - Role (`<USelect>` or `<USelectMenu>`) with options like `viewer`, `admin`, `super-admin`.
  - Organization (`<USelectMenu>` fetching from `/api/organizations`).
- The password will be hardcoded on the backend as `kompas2026`.
- On successful submission, show a toast notification displaying the default password `kompas2026`, refresh the users table, and close the slideover.

#### [MODIFY] `app/layouts/default.vue` or sidebar config (if applicable)
- Add a navigation link to `/settings/team` that is only visible to `super-admin` users.

## Verification Plan

### Manual Verification
1. Log in as a `super-admin`.
2. Navigate to `/settings/team`.
3. Ensure the users list renders correctly with their respective organizations.
4. Open the "Create User" slideover.
5. Fill in the details (Email, Name, Role, Organization) and submit.
6. Verify the user is created successfully, a toast shows the default password, and the user appears in the table.
7. Log in as a regular user or `admin` and attempt to access `/settings/team` to verify it redirects or blocks access.
