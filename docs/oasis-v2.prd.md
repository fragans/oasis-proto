# Oasis - Customer Engagement & Data Platform

## Problem Statement

KG Media operates multiple digital products (e.g., Kompas.id) with large, fragmented customer bases. Marketing and product teams cannot build unified customer views, create self-serve audience segments, or launch in-app campaigns without engineering involvement. Data lives across multiple systems with no single workspace to manage contacts, track behavior, or target audiences.

## Evidence

- Marketing teams require ad-hoc database queries from engineers to create audience segments.
- Campaign launches require multi-team coordination across tools with no unified workflow.
- No single dashboard exists to understand audience health, reachability, or engagement trends.
- External systems (SSO, Oval) have customer data that must be ingested and unified.

## Proposed Solution

Oasis is a multi-tenant web platform that consolidates contact management, audience segmentation, in-app campaign creation, behavioral event tracking, and a data ingest API into a single workspace for marketing, CRM, and product teams.

## Key Hypothesis

We believe a centralized customer engagement platform will eliminate engineering dependency for audience segmentation and campaign creation for marketing teams. We'll know we're right when segment creation time drops below 5 minutes and campaigns launch without engineering involvement.

## What We're NOT Building

- **Message delivery infrastructure** - Oasis configures campaigns and audiences; actual push/email dispatch is handled externally.
- **Sales CRM** - No deal tracking, pipeline management, or sales workflows.
- **Real-time streaming analytics** - Dashboards reflect near-real-time aggregated state, not live streams.
- **Self-service account registration** - Accounts are created by super admins only.
- **Public API documentation portal** - API docs are internal.
- **Native mobile app for operators** - Desktop/tablet web only.

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Ingest API uptime | >= 99.5% monthly | Monitoring |
| Contact list page load | < 3s (p95) | Performance monitoring |
| Segment creation time | < 5 minutes self-serve | User analytics |
| Campaign creation time | < 10 minutes | User analytics |
| Dashboard load time | < 3s (p95) | Performance monitoring |
| Invitation acceptance rate | > 80% within 48 hours | Database query |

## Open Questions

- [ ] What is the expected peak ingest volume (contacts/hour) to size queue workers?
- [ ] Should dynamic segments re-evaluate continuously or on a scheduled refresh?
- [ ] Is campaign delivery (actual send) in scope for a future phase, or handled by an external system permanently?
- [ ] What SLA is required for the ingest API (uptime, latency)?
- [ ] Should deleted custom attributes hard-delete or soft-delete historical values?

---

## Users & Context

**Primary User: Marketing/CRM Operator**
- **Who**: Marketing team members and CRM operators at KG Media digital products.
- **Current behavior**: Rely on engineers for audience queries and multi-tool coordination for campaigns.
- **Trigger**: Need to create a targeted campaign, understand audience health, or onboard new contact data.
- **Success state**: Self-serve segment creation, campaign launch, and audience insights without engineering tickets.

**Job to Be Done**
When I need to reach a specific customer segment with an in-app campaign, I want to build the audience, configure the campaign, and activate it myself, so I can move faster without engineering bottlenecks.

**Non-Users**
- End consumers (they are *contacts* in the system, not operators)
- Sales teams (no pipeline/deal features)
- Data engineers (they interact via the ingest API, not the UI)

---

## Roles & Access Control

| Role              | Level           | Access                                                                                              |
|------|-------|--------|
| **Super Admin**   | `super_admin`   | Full platform access. Manages accounts, users, system settings. Can see all accounts.               |
| **Administrator** | `administrator` | Manages one or more accounts. Can invite users, configure attributes/events, manage API settings.   |
| **Editor**        | `editor`        | Can manage contacts, segments, and campaigns within assigned account.                               |
| **Viewer**        | `viewer`        | Read-only access within assigned account.                                                           |

**Multi-tenancy**: Each user may belong to multiple accounts via `user_account_access` pivot. All data (contacts, segments, campaigns, events, attributes) is scoped to `account_id`. Users select their active account on login.

**PII Access Control**: Per-user `can_access_pii` flag on the account access pivot. When false, PII fields (email, phone, name) are hidden in all contact views.

**Role visibility**: Non-super-admins cannot see super_admin users in the user management list.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Contact Management (CRUD, bulk import/export, search, PII control) | Core data layer everything else builds on |
| Must | Contact Filtering (unified cross-type AND/OR filters) | Required for segmentation and campaign targeting |
| Must | Segment Management (static + dynamic, tags, duplicate, export) | Primary self-serve capability replacing engineering queries |
| Must | In-App Campaign Management (template editor, status lifecycle, audience targeting) | Primary engagement tool |
| Must | Attributes & Events System (default + custom, CRUD, categories) | Extensible data schema for contacts |
| Must | Ingest API (token-authenticated, batch upsert, auto-create attributes) | Bridge to upstream data systems |
| Must | Dashboard Analytics (counts, charts, trends, reachability) | At-a-glance account health |
| Must | User & Account Management (invitations, roles, multi-account) | Platform access control |
| Must | API Settings (token generation, display, copy) | Self-serve API credential management |
| Should | Email Campaign Builder (basic parameters, segment association) | Extends campaign capabilities |
| Should | Audit Logging (user actions, IP, user agent) | Compliance and debugging |
| Could | Campaign Scheduling (start/end dates) | Automated campaign lifecycle |
| Won't | A/B testing or multivariate experiments | Deferred to future |
| Won't | Push notification delivery | External system responsibility |
| Won't | SMS campaigns | Out of scope for v1 |

---

## Feature Specifications

### F1. Contact Management

#### F1.1 Contact Data Model

**Core fields** (stored directly on contacts table):

| Field | Type | Notes |
|-------|------|-------|
| `contact_id` | UUID v7 | Auto-generated, unique per account |
| `uuid` | string | External UUID from SSO/Oval |
| `mykompas_id` | string | MyKompas identifier |
| `first_name` | string | |
| `last_name` | string | |
| `fullname` | string | Independently editable; falls back to first_name + last_name |
| `email_address` | string | PII field |
| `phone_number` | string | PII field |
| `birthday` | date | |
| `gender` | string | |
| `city` | string | |
| `state` | string | |
| `country` | string | |
| `time_zone` | string | |
| `crea_date` | date | Contact creation/join date in source system |
| `account_id` | FK | Tenant scope |

**Opt-in preferences** (directly on contacts table):

| Field | Type | Notes |
|-------|------|-------|
| `app_push_opt` | boolean | App push notification opt-in |
| `app_push_token` | string | |
| `email_push_opt` | boolean | Email opt-in |
| `web_push_opt` | boolean | Web push opt-in |
| `wp_token` | string | Web push token |

**Email status counters**:

| Field | Type | Notes |
|-------|------|-------|
| `email_bounce` | integer | Bounce count |
| `email_invalid` | integer | Invalid email count |
| `email_block` | integer | Block count |
| `spam_report` | integer | Spam report count |
| `global_unsubscribe` | integer | Unsubscribe count |

**App lifecycle fields**:

| Field | Type |
|-------|------|
| `app_last_inst_date` | datetime |
| `app_last_uninst_date` | datetime |
| `login_status` | boolean |
| `app_location_opt` | boolean |
| `last_visit_date` | datetime |

**Email lifecycle fields**:

| Field | Type |
|-------|------|
| `last_email_sub_date` | datetime |
| `last_email_unsub_date` | datetime |
| `last_email_clicked_date` | datetime |
| `last_email_open_date` | datetime |

**Web push lifecycle fields**:

| Field | Type |
|-------|------|
| `wp_unsub_date` | datetime |
| `wp_sub_date` | datetime |
| `wp_language` | string |
| `wp_action_date` | datetime |

**Other fields**:

| Field | Type | Notes |
|-------|------|-------|
| `cart_abandoned` | boolean | |
| `static_segment_id` | JSON array | Legacy backward-compat field |

**Computed fields**:

| Field | Type | Rule |
|-------|------|------|
| `reachability_status` | enum: `reachable`, `unreachable` | Auto-computed on save: UNREACHABLE if any of: email_bounce > 0, email_invalid > 0, email_block > 0, spam_report > 0 |
| `full_name` (virtual) | string | Returns `fullname` column if set, else `first_name + last_name` |
| `age` (virtual) | integer | Calculated from birthday |
| `unreachable_reasons` (virtual) | string[] | Array of reason labels: Bounced, Invalid, Blocked, Spam Report, Unsubscribed |

#### F1.2 Contact CRUD

- **Create**: Form-based individual contact creation.
- **Read**: Detail page showing profile, devices, custom attribute values, recent events.
- **Update**: Edit any contact field.
- **Delete**: Standard delete.

#### F1.3 Contact Search

Search across contacts within current account. Searchable by:

| `search_by` value | Fields searched |
|-------------------|----------------|
| `all` | contact_id, phone, email, first_name, last_name |
| `name` | first_name, last_name, CONCAT(first_name, last_name) |
| `contact_id` | contact_id |
| `email` | email_address (exact column name) |
| `phone` | phone_number |

Search is case-insensitive (LOWER comparison with LIKE).

#### F1.4 Contact Filtering System

The filtering system supports **4 filter types** that can be combined with AND/OR logic:

**Unified Filter Structure** (`unified_filters` JSON parameter):
```json
[
  {
    "type": "event|device|attribute|reachability",
    "logic": "and|or",
    "filter": { /* type-specific filter object */ }
  }
]
```

First filter always uses AND. Subsequent filters use their specified `logic` connector.

**Filter Type 1: Event Filters**

Filters contacts by event occurrence count within a time range.

| Parameter | Values |
|-----------|--------|
| `eventName` | Event type slug |
| `operator` | `is`, `is_not`, `less_than`, `more_than`, `less_than_or_equal`, `more_than_or_equal` |
| `times` | integer (default: 1) |
| `timeRange` | `in_the_last`, `on_date`, `between` |
| `timeValue` | integer (for `in_the_last`) |
| `timeUnit` | `days`, `hours`, `minutes`, etc. |
| `date` | date string (for `on_date`) |
| `dateRange` | `{ start, end }` (for `between`) |

**Filter Type 2: Device Filters**

Filters contacts by device attributes (only active devices).

| Allowed attributes | `platform`, `device_type`, `device_brand`, `device_model`, `os_version`, `app_version`, `timezone`, `carrier` |
|--------------------|---|
| **Operators** | `contains`, `not_contains`, `is_exactly`, `does_not_match`, `is_empty`, `is_not_empty` |

**Filter Type 3: Attribute Filters**

Filters contacts by contact attributes.

| Allowed attributes | `email_address`, `first_name`, `last_name`, `phone_number`, `city`, `state`, `gender`, `reachability_status`, `email_bounced`, `email_invalid`, `email_blocked`, `email_unsubscribed`, `spam_reported` |
|--------------------|---|
| **String operators** | `contains`, `not_contains`, `is_exactly`, `does_not_match`, `is_empty`, `is_not_empty` |
| **Boolean mapping** | `email_bounced` -> `email_bounce > 0`, `email_invalid` -> `email_invalid > 0`, `email_blocked` -> `email_block > 0`, `email_unsubscribed` -> `global_unsubscribe > 0`, `spam_reported` -> `spam_report > 0` |

Values can be arrays (multi-select) or single strings.

**Filter Type 4: Reachability Filters**

Filters contacts by opt-in status per channel.

| Parameter | Values |
|-----------|--------|
| `channel` | `email` / `email_push_opt`, `web_push` / `web_push_opt`, `in_app_push` / `app_push_opt` |
| `reachabilityStatus` | `reachable` (opt = true), `unreachable` (opt = false or null) |

**Segment-level filter grouping**:

Filters can be grouped into **segments** (filter groups). Each segment has:
- `filters[]`: Array of unified filters combined with AND/OR internally.
- `connector`: `and` or `or` - how this segment combines with the previous segment.

This enables complex nested logic like: `(A AND B) OR (C AND D)`.

#### F1.5 Bulk Import

- **Format**: CSV or Excel upload.
- **Duplicate handling**: Upsert by email -> phone -> contact_id priority.
- **Field mapping**: User maps CSV columns to contact fields.
- **Error reporting**: Per-row error tracking.

#### F1.6 Export

- Export filtered contact lists.
- Applies current search and filter criteria.

#### F1.7 PII Access Control

- PII fields: `email_address`, `phone_number`, `first_name`, `last_name`, `fullname`.
- Users with `can_access_pii = false` on their account access record cannot see these fields.
- Enforcement must be at query level, not just UI.

---

### F2. Segment Management

#### F2.1 Segment Types

| Type | Behavior |
|------|----------|
| **Static** | Manually curated contact lists. Contacts added via upload, UI selection, or API. |
| **Dynamic** | Rule-based segments using the unified filter system. Auto-update on query. |

#### F2.2 Segment CRUD

- **Create**: Name (required, unique per account+type), description (optional), type, tags.
  - Static segments can be created from the contacts page with current filters applied (bulk attach matching contacts).
  - Validation: duplicate name within same account and type is rejected (422).
- **Read**: List with pagination, search (name, description), tag filter, sort (id, name, created_at).
- **Show**: Segment detail with contact list (paginated, searchable, sortable).
- **Delete**: Standard delete. No cascade protection for campaign references currently.
- **Update Tags**: Sync tags (create new ones inline if they don't exist).

#### F2.3 Segment Operations

- **Refresh Count**: Recount contacts in segment (via pivot table count).
- **Duplicate**: Creates `{name} (Copy)` with incrementing counter if name exists. Copies tags and contacts.
- **Export**: Export segment contact list.
- **Upload Users**: Bulk add contacts to a static segment via CSV.
- **Remove Contact**: Remove individual contact from segment.

#### F2.4 Segment Contact Display

Contact list within a segment shows:
- full_name, email, phone, reachability_status, unreachable_reasons
- `pivot_created_at` (assigned_at from contact_segment pivot)
- Sortable by: full_name, reachability_status, email, created_at, pivot_created_at

Pagination: configurable per_page (max 100).

---

### F3. Campaign Management

#### F3.1 In-App Campaigns

**Campaign Data Model**:

| Field | Type | Notes |
|-------|------|-------|
| `account_id` | FK | Tenant scope |
| `name` | string (max 255) | Required |
| `description` | string (max 255) | Optional |
| `status` | enum | `draft`, `scheduled`, `active`, `passive`, `completed` |
| `template_slug` | string (max 100) | Links to app template type |
| `configuration` | JSON | Full editor state (variants, elements, styles, content, targeting) |
| `segment_id` | FK | Optional segment association |
| `starts_at` | datetime | Schedule start |
| `ends_at` | datetime | Schedule end |

**Status Lifecycle**:

```
draft -> active (activates audience computation)
draft -> scheduled
scheduled -> active
active -> passive (clears audience)
passive -> active (recomputes audience)
```

Toggle logic:
- `active` -> `passive`
- `passive`, `draft`, `scheduled` -> `active`

**Campaign Operations**:
- **Save Draft**: Create new or update existing campaign. Requires name + configuration JSON.
- **Upload Image**: Accepts jpg/jpeg/png/gif/webp, max 5MB. Stores in cloud object storage under `template-app/images/`. Returns public URL.
- **Duplicate**: Creates copy with `_copy` suffix, status reset to `draft`, segment_id cleared, dates cleared. Tags copied, audience NOT copied (recomputed on activation).
- **Toggle Status**: Activates (computes audience) or deactivates (clears audience).
- **Update Tags**: Sync tags by name.
- **Delete**: Detaches tags, then deletes campaign.
- **List**: Filterable by status[], template_slug[], search. Paginated. Includes segment and tags relations.

**Campaign Audience Computation** (on activation):
1. Read `configuration.targeting.segments[]` from campaign JSON.
2. Each segment contains filters using the unified filter system (same as contact filtering).
3. Segments are combined with AND/OR connectors.
4. No targeting = target ALL contacts for the account.
5. Matching contact IDs are bulk-inserted into `campaign_audiences` table (1000/batch).
6. On deactivation, audience entries are cleared.

**Audience Estimation**:
Separate endpoint to estimate audience count without persisting. Uses the same filter resolution logic.

#### F3.2 Email Campaigns

- Basic campaign builder for defining email campaign parameters.
- Associates campaigns with a contact segment.
- Minimal implementation in current system.

#### F3.3 App Templates

- Template gallery for selecting campaign types.
- Templates define the base structure/type (e.g., InApp modal, Wheel of Fortune).
- Template data model: `slug` (unique), `name`, `description`, `thumbnail`, `category`, `is_active`, `default_configuration` (JSON).

---

### F4. Attributes & Events System

#### F4.1 Contact Attributes

**Attribute Definition Model**:

| Field | Type | Notes |
|-------|------|-------|
| `account_id` | FK (nullable) | NULL for system defaults |
| `name` | string (max 100) | Display name |
| `system_name` | string (max 100) | Unique per account. Regex: `^[a-z][a-z0-9_]*$` |
| `data_type` | enum | `string`, `number`, `boolean`, `date`, `json`, `array` |
| `category` | enum | `contact`, `device`, `preference`, `custom` |
| `source` | enum | `api`, `email`, `mobile_sdk`, `web` |
| `is_default` | boolean | True for system defaults (read-only definitions) |
| `is_pii` | boolean | PII flag |
| `show_on_segment` | boolean | Show in segment builder |
| `is_api_updatable` | boolean | Can be updated via ingest API |
| `affects_reachability` | boolean | Affects contact reachability |
| `reachability_rule` | enum | `true_makes_unreachable`, `false_makes_unreachable` |
| `notes` | text | User notes |
| `sample_data` | string | Example value for display |
| `sort_order` | integer | Display order |
| `is_active` | boolean | Soft-delete flag |

**Default vs Custom**:
- Default attributes: `account_id = NULL`, `is_default = true`. Cannot be deleted. Only `notes`, `is_pii`, `show_on_segment` can be updated.
- Custom attributes: `account_id` set, `is_default = false`. Full CRUD. Delete = soft-delete (`is_active = false`).

**Scope**: Attributes visible to an account = all defaults (account_id IS NULL) + account's custom attributes.

**Custom Attribute Values (EAV)**:

Stored in `contact_custom_values` table:

| Field | Type | Notes |
|-------|------|-------|
| `contact_id` | FK | |
| `attribute_id` | FK | References contact_attributes |
| `value_string` | string | |
| `value_number` | decimal | |
| `value_boolean` | boolean | |
| `value_date` | datetime | |
| `value_json` | JSON | |

Only one value column is populated based on the attribute's `data_type`. Type detection is automatic when ingested via API.

#### F4.2 Event Types

**Event Type Model**:

| Field | Type | Notes |
|-------|------|-------|
| `account_id` | FK (nullable) | NULL for system defaults |
| `name` | string (max 100) | Display name |
| `slug` | string (max 50) | Unique per account. Regex: `^[a-z][a-z0-9_]*$` |
| `category` | enum | `journey`, `email`, `app`, `web`, `custom` |
| `is_default` | boolean | System defaults are read-only |
| `is_active` | boolean | Soft-delete flag |
| `notes` | text | |

Default events: Cannot delete. Only `notes` can be updated.
Custom events: Full CRUD. Delete = soft-delete.

**Event Type Parameters**:

| Field | Type | Notes |
|-------|------|-------|
| `event_type_id` | FK | |
| `name` | string | Parameter name |
| `data_type` | string | Parameter value type |
| `description` | text | |
| `is_customable` | boolean | Whether user can define custom values |

**Parameter Value Options** (predefined lists):

| Field | Type |
|-------|------|
| `parameter_id` | FK |
| `value` | string |
| `label` | string |

#### F4.3 Contact Events

| Field | Type | Notes |
|-------|------|-------|
| `account_id` | FK | Tenant scope |
| `contact_id` | FK | |
| `event_type_id` | FK | |
| `occurred_at` | datetime | When the event happened |
| `metadata` | JSONB (GIN indexed) | Flexible event payload |

#### F4.4 Grouped Views

Both attributes and events support grouped views for cascade dropdowns:
- **default**: System-defined items
- **custom**: Account-specific items

---

### F5. Ingest API

**Endpoint**: `POST /api/v1/contacts/ingest`
**Auth**: `Authorization: Bearer {account-token}`
**Rate limit**: 60 requests/minute per account

**Payload Structure**:
```json
{
  "contact": [
    {
      "identifiers": {
        "email": "user@example.com",
        "phone": "+628123456",
        "contact_id": "existing-id"
      },
      "attributes": {
        "name": "John Doe",
        "email_optin": true,
        "first_name": "John",
        "static_segment_id": [108, 209],
        "custom": {
          "expired_date": "2027-02-05T02:05:06Z",
          "kompascomplus": true,
          "subscription_tier": "premium"
        }
      }
    }
  ]
}
```

**Validation Rules**:
- `contact`: Required array, min 1, max 1000 items.
- Each contact must have at least one identifier (email, phone, or contact_id).
- `identifiers.email`: Valid email, max 255.
- `identifiers.phone`: String, max 50.
- `identifiers.contact_id`: String, max 255.
- `attributes.static_segment_id.*`: Integer.
- `attributes.custom`: Flexible key-value pairs.

**Processing Pipeline** (per contact, within a transaction):

1. **Resolve Contact**: Priority order email -> phone -> contact_id. Each lookup is scoped to account_id. If no match, create new contact with UUID v7 as contact_id.

2. **Upsert Default Attributes**: Map payload fields to contacts table columns.
   - Identifier values mapped: `email` -> `email_address`, `phone` -> `phone_number`.
   - Alias mapping: `name` -> `first_name`, `email_optin` -> `email_push_opt`.
   - Skip non-fillable fields and identity fields (`account_id`, `contact_id`).
   - Auto-cast values based on model casts (boolean, integer, date, array).
   - New contacts without `first_name` default to "Unknown".

3. **Upsert Custom Attributes (EAV)**:
   - Normalize field name to `snake_case` for `system_name`.
   - If attribute definition doesn't exist, auto-create it with:
     - Auto-detected data type from value
     - `source: api`, `category: custom`, `is_default: false`, `is_api_updatable: true`
   - Upsert value in `contact_custom_values` (firstOrNew by contact_id + attribute_id).

4. **Assign Static Segments**:
   - Verify segment exists, belongs to account, and is type `static`.
   - Check if already assigned (skip if so).
   - Insert into `contact_segment` pivot with `assigned_at` timestamp.
   - Update legacy `static_segment_id` JSON array on contact for backward compat.

**Response**: Stats summary (contacts_created, contacts_updated, custom_attributes_created, segments_assigned, skipped, errors[]).

**Error handling**: Per-contact try/catch with transaction. Failed contacts are skipped and logged; processing continues for remaining contacts.

**Token Validation Middleware**:
1. Extract Bearer token from Authorization header.
2. Load all accounts with api_token, decrypt each, compare with `hash_equals`.
3. Inactive accounts return 403.
4. Rate limit: 60 req/min per account using cache counter with 60s TTL.
5. Resolved account bound to request for controller access.

---

### F6. Dashboard Analytics

**Summary Cards**:
- Total contacts, total devices, total events, total segments
- Events today vs yesterday (percentage trend)
- New contacts this week
- Active vs inactive devices

**Charts**:

| Chart | Data |
|-------|------|
| Contact reachability distribution | Group by `reachability_status`: reachable, unreachable, unknown |
| Platform distribution | Group devices by `platform` |
| Device type distribution | Group devices by `device_type` |
| Top event types | Top 8 by occurrence count |
| Events over time | Last 14 days, daily aggregation, fill missing days with 0 |
| Opt-in preferences | Count of email_push_opt, app_push_opt, web_push_opt = true |

**Recent Events Feed**: Last 5 events with contact and event type relations.

---

### F7. User & Account Management

#### F7.1 Account Management (Super Admin only)

- **Create**: Name (required, unique, max 100), description (max 500). Starts active.
- **Update**: Name, description, is_active.
- **Toggle Status**: Flip is_active boolean.
- **Delete**: Only if account has 0 users AND 0 contacts. Otherwise rejected with message.
- **List**: Paginated with search (name, description), status filter (active/inactive), sort (name, is_active, created_at, users_count, contacts_count). Shows user count and contact count.

#### F7.2 User Management (Admin + Super Admin)

- **List**: Users with access to current account. Paginated with filters:
  - Status: active (is_active=true AND not expired), expired (expires_on <= now), inactive (is_active=false)
  - Role filter
  - Search (name, email)
  - Sort: name, email, user_role, expires_on, is_active
- **Invite User**: Send email invitation with:
  - Email, role, optional PII access, optional expiration date.
  - Creates `user_invitations` record with token.
- **Check Email**: Verify if email already has a user account (for UI guidance).
- **Resend Invitation**: Resend invitation email.
- **Toggle Status**: Enable/disable user.
- **Edit**: Update user details, role, PII access.
- **Delete**: Remove user.

#### F7.3 Invitation Flow

1. Admin invites user -> invitation record created with unique token, email, role, account_id, optional PII access flag, optional expiry.
2. Invited user receives email with link to `/invitation/{token}`.
3. Invitation page validates: token exists, not already accepted, not expired.
4. User sets name and password (min 8 chars, at least 1 number, at least 1 special character).
5. If user with that email already exists: update password + name, add account access.
6. If new user: create user record + account access.
7. Account access record includes: role, expires_on, can_access_pii.
8. Mark invitation as accepted. Redirect to login.
9. Force logout any existing session before showing invitation form (prevents session conflicts).

#### F7.4 Authentication Flow

1. Login with email + password (session-based).
2. Track `last_login` timestamp.
3. After login, redirect to account selection if user has multiple accounts.
4. Selected account stored in session as `current_account_id`.
5. All subsequent requests scoped to selected account via middleware.
6. Account switching available without re-login.

---

### F8. API Settings

- **Access**: Administrator and Super Admin only.
- **Display**: Shows current API token (masked by default), base URL for API endpoint.
- **Generate Token**: One-time generation only. Cannot regenerate (409 if token exists).
  - Generates 64-character random string.
  - Stored encrypted (reversible) so all admins can view the plaintext.
- **UI**: Copy to clipboard, animated reveal/hide of token value.

---

### F9. Tags System

Polymorphic tagging system used across:
- Segments
- Campaigns
- Attributes (via morphToMany)

**Tag Model**:
- `name`: string, unique globally.
- Tags are created inline (firstOrCreate by name).
- Tags are synced (replaced, not appended) on update.

**Taggable pivot**: `taggable_id`, `taggable_type`, `tag_id`.

---

### F10. Contact Devices

| Field | Type | Notes |
|-------|------|-------|
| `contact_id` | FK | |
| `platform` | string | iOS, Android |
| `device_type` | string | |
| `device_brand` | string | |
| `device_model` | string | |
| `os_version` | string | |
| `app_version` | string | |
| `timezone` | string | |
| `carrier` | string | |
| `is_active` | boolean | Active status |

Device filters only apply to active devices (`is_active = true`).

---

## Data Model Summary

### Entity Relationship Overview

```
accounts 1──N contacts
accounts 1──N segments
accounts 1──N app_campaign_list
accounts 1──N contact_attributes (custom)
accounts 1──N event_types (custom)
accounts N──M users (via user_account_access)

contacts N──M segments (via contact_segment, with assigned_at)
contacts 1──N contact_custom_values
contacts 1──N contact_events
contacts 1──N contact_devices

contact_attributes 1──N contact_custom_values
event_types 1──N contact_events
event_types 1──N event_type_parameters
event_type_parameters 1──N parameter_value_options

app_campaign_list N──1 segments (optional)
app_campaign_list 1──N campaign_audiences
campaign_audiences N──1 contacts

tags N──M segments (morphMany via taggables)
tags N──M app_campaign_list (morphMany via taggables)

users N──1 user_levels
users 1──N user_invitations (as inviter)
user_invitations N──1 accounts
```

### Key Tables

| Table | Purpose | Key Constraints |
|-------|---------|-----------------|
| `accounts` | Tenant records | name unique, api_token encrypted |
| `users` | Platform operators | email unique, FK to user_levels |
| `user_levels` | Role definitions | level_name unique: super_admin, administrator, editor, viewer |
| `user_account_access` | Multi-tenant pivot | unique(user_id, account_id), includes role, expires_on, can_access_pii |
| `user_invitations` | Invitation tokens | token, email, role, account_id, accepted_at, expires_at |
| `contacts` | Customer records | account_id scoped, reachability_status auto-computed |
| `contact_segment` | Contact-segment pivot | contact_id, segment_id, assigned_at |
| `segments` | Audience groups | account_id scoped, type: static/dynamic, name unique per account+type |
| `contact_attributes` | Attribute definitions | account_id nullable (NULL=default), system_name unique per account |
| `contact_custom_values` | EAV values | unique(contact_id, attribute_id), typed value columns |
| `event_types` | Event definitions | account_id nullable, slug unique per account |
| `contact_events` | Event log | account_id, contact_id, event_type_id, occurred_at, metadata JSONB (GIN indexed) |
| `contact_devices` | Device registrations | contact_id, platform, is_active |
| `event_type_parameters` | Event param definitions | event_type_id FK |
| `parameter_value_options` | Predefined param values | parameter_id FK |
| `app_campaign_list` | Campaign configs | account_id, status lifecycle, configuration JSON |
| `campaign_audiences` | Campaign targeting results | campaign_id, contact_id pivot |
| `app_templates` | Template definitions | slug unique, default_configuration JSON |
| `tags` | Global tag pool | name unique |
| `taggables` | Polymorphic pivot | tag_id, taggable_id, taggable_type |
| `attribute_filter_values` | Filter option values | For populating filter dropdowns |
| `audit_logs` | Action logging | user_id, action, details JSON, ip_address, user_agent |
| `sessions` | Session storage | Database-backed Laravel sessions |
| `cache_table` | Cache storage | Database-backed cache |

---

## Technical Approach

**Feasibility**: HIGH - This is a well-understood CRUD + data platform with clear domain boundaries.

**Architecture Notes**:
- Multi-tenant via `account_id` scoping on all queries. Middleware enforces account selection.
- Session-based auth for web UI. Token-based auth for ingest API (separate middleware).
- EAV pattern for custom attributes (typed value columns: string, number, boolean, date, json).
- JSON configuration storage for campaign editor state.
- Cloud object storage (S3-compatible) for campaign images.
- Database-backed sessions, cache, and queues (upgradeable to Redis).
- Polymorphic tagging system across entities.

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Contact filtering performance at scale (1M+ contacts with complex AND/OR filters) | Medium | Database indexes, query optimization, pagination. Consider materialized views for dynamic segments. |
| Ingest API token lookup (decrypts all tokens per request) | Medium | Cache token->account mapping, or switch to hashed tokens with lookup table. |
| EAV query performance for custom attribute filtering | Medium | Index custom_values table. Consider denormalization for frequently filtered attributes. |
| Campaign audience computation blocking for large audiences | Low | Use background jobs with chunked inserts (already 1000/batch). |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Foundation | Auth, multi-tenancy, account/user management, roles, invitations | pending | - | - | - |
| 2 | Data Layer | Contact model, attributes system (default + custom EAV), events system | pending | - | 1 | - |
| 3 | Contact Management | Contact CRUD, bulk import/export, search, PII control | pending | - | 2 | - |
| 4 | Filtering Engine | Unified filter system (event, device, attribute, reachability), AND/OR logic | pending | - | 2, 3 | - |
| 5 | Segment Management | Static + dynamic segments, tags, duplicate, export, upload users | pending | - | 4 | - |
| 6 | Campaign Management | Templates, campaign CRUD, editor, status lifecycle, audience computation | pending | with 7 | 4, 5 | - |
| 7 | Ingest API | Token auth, batch upsert, auto-create attributes, segment assignment | pending | with 6 | 2 | - |
| 8 | Dashboard | Analytics dashboard with charts, trends, recent activity | pending | - | 2, 3 | - |
| 9 | API Settings | Token generation UI, display, copy | pending | with 8 | 7 | - |

### Phase Details

**Phase 1: Foundation**
- **Goal**: Establish auth, multi-tenancy, and user management.
- **Scope**: Login/logout, session management, user_levels, accounts CRUD (super admin), user invitations, account selection, account-scoped middleware, PII access control.
- **Success signal**: A super admin can create accounts, invite users, and invited users can accept invitations and log in.

**Phase 2: Data Layer**
- **Goal**: Build the extensible data schema for contacts.
- **Scope**: Contact model with all fields, contact_attributes (default + custom CRUD), EAV storage (contact_custom_values), event_types (default + custom CRUD), event_type_parameters, contact_events, contact_devices, reachability auto-computation, tags system.
- **Success signal**: Custom attributes and events can be defined per account, and contact data stores correctly in both direct columns and EAV table.

**Phase 3: Contact Management**
- **Goal**: Full contact CRUD with bulk operations.
- **Scope**: Contact create/read/update/delete, contact detail page (profile, devices, custom values, events), bulk CSV/Excel import with upsert logic, filtered export, search across fields.
- **Success signal**: A user can create, import, search, view, and export contacts within their account.

**Phase 4: Filtering Engine**
- **Goal**: Build the reusable cross-type filter system.
- **Scope**: Unified filter trait/service supporting event, device, attribute, and reachability filters with AND/OR logic. Segment-level grouping with connectors. Shared between contacts list, segment builder, and campaign audience targeting.
- **Success signal**: Complex filter queries (e.g., "contacts who opened email in last 7 days AND are on iOS AND opted into push") return correct results.

**Phase 5: Segment Management**
- **Goal**: Self-serve audience segmentation.
- **Scope**: Static + dynamic segments, CRUD, tags, duplicate, refresh count, export, upload users, remove contact. Create from contacts page with filters.
- **Success signal**: A marketer can create a segment with filter rules and see the matching audience without engineering help.

**Phase 6: Campaign Management**
- **Goal**: Visual campaign creation and management.
- **Scope**: Template gallery, campaign CRUD, JSON-based editor configuration, status lifecycle, image upload, duplicate, tag management, audience computation on activation, audience estimation.
- **Success signal**: A campaign can be created, configured, activated with audience targeting, and deactivated.

**Phase 7: Ingest API**
- **Goal**: External data ingestion pipeline.
- **Scope**: Token-authenticated REST endpoint, batch contact upsert (up to 1000), contact resolution (email > phone > contact_id), auto-create custom attributes, segment assignment, rate limiting, error reporting.
- **Success signal**: External system can ingest 1000 contacts in a single API call with correct upsert behavior.

**Phase 8: Dashboard**
- **Goal**: At-a-glance account health and engagement overview.
- **Scope**: Summary cards, reachability distribution, platform/device charts, top events, events over time (14 days), opt-in preferences, recent events feed, day-over-day trends.
- **Success signal**: Dashboard loads within 3 seconds and reflects current account state.

**Phase 9: API Settings**
- **Goal**: Self-serve API credential management.
- **Scope**: Token generation (one-time), encrypted storage, admin-only access, copy to clipboard, reveal/hide animation.
- **Success signal**: An admin can generate and copy an API token without engineering involvement.

### Parallelism Notes

- Phases 6 and 7 can run in parallel since they share the data layer (Phase 2) but have independent concerns (UI campaigns vs API ingestion).
- Phases 8 and 9 can run in parallel as dashboard and API settings are independent features.
- Phase 4 (Filtering Engine) is a critical dependency for both Segments (5) and Campaigns (6).

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Custom attribute storage | EAV (typed value columns) | JSON column, wide table | EAV allows unlimited custom attributes without schema changes. Typed columns enable proper indexing and type safety. |
| Campaign configuration | JSON column | Normalized tables | Campaign editor state is deeply nested and varies by template. JSON is natural storage for this. |
| Contact resolution | email > phone > contact_id priority | Single identifier, composite key | Matches Insider-style upsert pattern. Email is most reliable identifier across KG Media systems. |
| API token storage | Encrypted (reversible) | Hashed (one-way) | All admins need to view the token. Reversible encryption enables display without regeneration. |
| Segment contact storage | Pivot table (contact_segment) | JSON array on segment, materialized view | Pivot table enables efficient counting, pagination, and individual contact management. |
| Attribute deletion | Soft delete (is_active = false) | Hard delete | Preserves historical data integrity. Custom values remain queryable for reporting. |
| Multi-tenancy | account_id column scoping | Schema-per-tenant, row-level security | Column scoping is simpler to implement, sufficient for expected account count, and compatible with shared hosting. |
| Tag system | Polymorphic (global tag pool) | Per-entity tag tables | Enables consistent tagging UX across segments, campaigns, and attributes with shared tag pool. |

---

## Research Summary

**Market Context**
- Oasis follows the Insider/Braze pattern: unified customer data platform with self-serve segmentation and campaign management.
- Key differentiator: built specifically for KG Media's internal needs (Kompas.id integration, Huawei Cloud infrastructure).
- Competitors solve this with expensive SaaS (Insider, Braze, CleverTap). Oasis provides an owned, customizable alternative.

**Technical Context**
- Current implementation uses Laravel 11 + Alpine.js + PostgreSQL + Tailwind CSS.
- 56 database migrations reflecting iterative development.
- ~19 Eloquent models, ~22 controllers, ~47 Alpine.js components.
- Production runs on cPanel with Huawei Cloud PostgreSQL and OBS (object storage).
- Existing codebase has comprehensive feature set but some controllers are large (ContactController ~1500 lines) indicating refactoring opportunities in the rewrite.

---

*Generated: 2026-04-15*
*Status: DRAFT - extracted from existing codebase for rewrite*
