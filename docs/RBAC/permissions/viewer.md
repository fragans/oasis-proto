# Viewer Role

The **Viewer** role is designed for users who need read-only access to the Oasis Dashboard. They can monitor campaigns and performance but cannot perform any actions that modify the system state.

## Permissions

### Campaigns (On Site Messages)
- **[READ]** View the list of all campaigns in the active organization.
- **[READ]** View campaign details and configuration.
- **[DENY]** Create new campaigns.
- **[DENY]** Edit or modify existing campaigns.
- **[DENY]** Delete campaigns.
- **[DENY]** Clone campaigns.
- **[DENY]** Change campaign status (Launch, Pause, Resume, Archive).
- **[DENY]** Perform bulk actions.

### Creatives
- **[READ]** View creative assets associated with campaigns.
- **[DENY]** Upload new creatives.
- **[DENY]** Delete or replace existing creatives.

### Audiences & Segments
- **[READ]** View audience segments and their criteria.
- **[DENY]** Create or modify segments.

### Team Management
- **[READ]** View team members and their assigned roles.
- **[DENY]** Invite new members.
- **[DENY]** Change member roles or remove members.

## UI Restrictions
Users with the Viewer role will experience the following interface adjustments:
- "New Message" / "Add" buttons are hidden.
- Action menus (Edit, Clone, Delete) are removed.
- Bulk action toolbars are disabled.
- Saving changes in any wizard or settings page will result in a 403 Forbidden error (API level protection).
