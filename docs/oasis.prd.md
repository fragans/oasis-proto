# Product Requirements Document — OASIS Platform

**Product Name:** OASIS  
**Owner:** KG Media  
**Date:** 2026-04-13  
**Status:** Living Document

---

## 1. Introduction

OASIS is an internal customer engagement and ad-serving platform built for KG Media. It provides marketing and CRM teams with a unified workspace to manage contacts, define audience segments, launch campaigns across multiple channels, and track customer behavior — all within a secure, multi-tenant environment.

The platform serves the KG Media digital product portfolio — including **Kompas.com** (Indonesia's largest online news portal), **Kompas.id** (Harian Kompas digital subscription), and other KG Media-owned media properties. These sites and apps are the primary consumers of banner creatives served via OASIS-DELIVERY.

The platform is explicitly designed for high-read performance and scalability, ensuring the system can handle initial traffic requirements while providing a foundation for massive growth. It is decoupled into two distinct services: **OASIS-DASHBOARD** (the marketer-facing admin UI) and **OASIS-DELIVERY** (the high-traffic public banner delivery API).

---

## 2. Problem Statement

KG Media operates a portfolio of high-traffic digital media products — including **Kompas.com** (Indonesia's largest online news portal), **Kompas.id** (Harian Kompas digital subscription platform), and other owned media sites and apps — with large, fragmented customer bases. Marketing and product teams face the following challenges:

- **Data Silos:** Contact and behavioral data lives across multiple systems with no unified view.
- **Manual Segmentation:** Creating audience groups requires engineering involvement and ad-hoc database queries.
- **Campaign Complexity:** Launching in-app or email campaigns requires coordination between multiple teams and tools.
- **Limited Visibility:** No single dashboard to understand audience health, reachability, or engagement trends.
- **Delivery Bottlenecks:** Serving banner ads at scale exposes the database to traffic spikes, causing instability.

OASIS consolidates these capabilities into one platform accessible by non-technical teams, while protecting the data layer from delivery traffic via a Redis-backed delivery API.

---

## 3. Goals & Objectives

- **Rapid Delivery:** Utilize the Vue/Nuxt ecosystem (Nuxt 4 & Nuxt UI) to enable rapid prototyping and minimize time spent on UI development, focusing on core campaign logic.
- **High Performance:** Implement a decoupled, high-read architecture to comfortably serve thousands of requests per second (RPS) with sub-millisecond response times for banner delivery.
- **System Resilience:** Completely protect PostgreSQL from public traffic spikes via a Redis caching layer.
- **Operational Stability:** Keep the marketer dashboard highly responsive even during massive traffic spikes on the delivery API.
- **Centralized Contact Database:** Provide a unified contact store with support for custom attributes and event tracking.
- **Self-Serve Segmentation:** Enable self-serve audience segmentation (static and dynamic) without engineering support.
- **Multi-Channel Campaigns:** Support creation and delivery of in-app, email, and banner campaigns with a visual editor.
- **Reliable Ingest API:** Expose a reliable ingest API for syncing contact data from upstream systems (e.g., Oval, Kompas.id SSO, Kompas.com user accounts).
- **Actionable Analytics:** Give admins and marketers actionable analytics on contact reachability, campaign performance, and engagement.

---

## 4. Target Users & Roles

| Role | Primary Interaction |
|---|---|
| **Marketers** | Campaign creation, management, and viewing status via OASIS-DASHBOARD. |
| **Media Sites / App Developers** | High-speed banner retrieval via OASIS-DELIVERY API. Primary consumers: **Kompas.com** (web), **Kompas.id** (web + app), and other KG Media-owned properties (Android/iOS apps, web). |

### Platform Roles

| Role | Description |
|---|---|
| **Super Admin** | Full platform access. Manages accounts, users, and system-level settings. |
| **Admin** | Manages one or more accounts. Can invite users, configure attributes/events, view all data. |
| **User** | Standard operator. Can manage contacts, segments, and campaigns within their assigned account. PII access may be restricted. |

**Multi-tenancy:** Each user may belong to multiple accounts. All data (contacts, segments, campaigns, events) is scoped to a single account.

---

## 5. Key Architectural Requirements

To support expected massive growth, the platform must be decoupled into two distinct, independently deployable services:

- **OASIS-DASHBOARD (Admin UI):** Hosted on a dedicated domain (e.g., `admin.yourplatform.com`). Handles campaign management, contact data, and configuration.
- **OASIS-DELIVERY (Public API):** Hosted separately and optimized for high-traffic delivery (e.g., `api.yourplatform.com`), ideally leveraging Edge workers to minimize latency and protect the admin dashboard.

**Data flow:** When a campaign is activated in OASIS-DASHBOARD, the Nitro backend publishes active banner data to Redis. OASIS-DELIVERY reads exclusively from Redis for banner serving — PostgreSQL is never hit by delivery traffic.

---

## 6. Non-Functional Requirements

### Performance
- Contact list pages must support pagination of datasets up to 1M+ rows.
- Segment filter queries must execute within 5 seconds for up to 500K contacts.
- Dashboard queries must complete within 3 seconds.
- Minimum traffic handling: 1,000 requests per minute (17 RPS) — the stack is engineered to handle 50,000–100,000+ RPS using a single Redis instance.
- API response latency: sub-millisecond data retrieval from the caching layer.
- Database protection: 100% protection from delivery API traffic spikes; the public API must never directly hit PostgreSQL for banner delivery.

### Security
- All web routes require session-based authentication.
- All API routes require either session auth or a valid account API token.
- PII fields must respect per-user access restrictions at the query level (not just UI).
- API tokens must be stored as hashed values (or rotatable secrets), never in plaintext in logs.
- Input validation on all form submissions and API payloads.

### Scalability
- Multi-tenant data isolation via `account_id` scoping on all queries.
- Queue-based background processing for bulk operations (imports, segment refreshes).
- Cloud object storage (Huawei OBS / AWS S3) for all user-uploaded assets.

### Reliability
- Database: PostgreSQL hosted on Huawei Cloud (production), Neon (development).
- Caching and queues backed by Redis.
- CI/CD pipeline via GitHub Actions with automated tests on every push.

### Browser Support
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 major versions).
- Responsive layout for tablet and desktop (primary use case is desktop).

---

## 7. Technical Stack

### 7.1. OASIS-DASHBOARD Tech Stack (Marketer Dashboard)

Optimized for feature velocity, developer ergonomics, and secure data writes:

- **Frontend:** Nuxt 4 & Nuxt UI (pre-built, accessible components — tables, forms, modals).
- **API/Backend:** Nitro (serves API endpoints for the dashboard and handles campaign update events).
- **Data Layer (Source of Truth):** PostgreSQL (handles relational complexity and campaign creation/updates).
- **Caching Integration:** Redis (receives active banner data from Nitro immediately following a campaign update in PostgreSQL).

### 7.2. OASIS-DELIVERY Tech Stack (High-Traffic Delivery API)

Optimized purely for speed and read performance:

- **API/Edge Layer:** Nitro (lightweight, minimal, fast — designed for Edge workers).
- **Caching Layer (Shield):** Redis (primary data source; Nitro grabs the JSON object here).
- **Logic/Implementation:** Nitro's `defineCachedEventHandler` (ensures direct, fast Redis connection and full database protection).
- **Persistent Data Layer:** PostgreSQL (source of truth, completely protected from traffic spikes).

---

## 8. Use Cases

### 8.1. Campaign Management

Marketers use OASIS-DASHBOARD to create, configure, and manage advertising campaigns end-to-end.

#### 8.1.1. Campaign Creation

- **Campaign Form:** Marketers can create a new campaign by filling out a structured form: campaign name, description, objective, start/end dates, and priority level.
- **Creative Upload:** Each campaign supports one or more banner creatives (image, HTML, or rich media) with metadata such as click-through URL, alt text, and display dimensions. Images are stored on Huawei OBS / S3 and served via CDN.
- **Targeting Configuration:** Campaigns can be targeted using audience segments (§8.2), placement rules (specific sites/pages), device type, geography, and scheduling windows.
- **Budget & Pacing** *(optional for MVP)*: Set impression caps or daily budgets to control delivery volume.

#### 8.1.2. Campaign Lifecycle

- **Status Flow:** `Draft` → `Scheduled` → `Active` → `Paused` / `Completed`.
- **Activation:** When activated (or when the scheduled start date arrives), the Nitro backend publishes active banner data to Redis, making it immediately available via OASIS-DELIVERY.
- **Pause & Resume:** Marketers can pause an active campaign at any time, which removes its data from Redis and stops delivery instantly.
- **Edit & Clone:** Active or draft campaigns can be edited. Completed campaigns can be cloned as a starting point for new ones.

#### 8.1.3. Campaign List & Overview

- **Dashboard Table:** A searchable, sortable table listing all campaigns with columns for name, status, date range, impressions, CTR, and actions.
- **Quick Filters:** Filter by status (active, draft, completed, paused), date range, or segment.
- **Bulk Actions:** Select multiple campaigns for bulk pause, resume, or archive.

**Acceptance Criteria:**
- A campaign can be created as a draft, previewed, scheduled, and activated without engineering involvement.
- Duplicating a campaign creates a new draft with all configuration copied.
- Image uploads return a public CDN URL usable in campaign design.

---

### 8.2. Customer Data Management

Centralized management of customer profiles and audience segmentation, built from event data ingested from the **Oval** platform and the Ingest API (§8.4).

#### 8.2.1. Oval Event Integration

- **Data Source:** OASIS connects to Oval to receive event data (e.g., page views, purchases, sign-ups, content interactions) along with their event parameters (e.g., product ID, category, value, timestamp).
- **Event Ingestion:** Events are consumed via Oval's API (webhook or polling) and stored for profile enrichment, segmentation, and journey triggering.
- **Event Schema:** Each event consists of an event name, associated user identifier, timestamp, and a flexible set of key-value parameters defined in Oval.

#### 8.2.2. Contact Management

- Store and display core contact fields: name, email, phone, birthday, location, gender, language.
- Support bulk import via CSV/Excel upload with field mapping.
- Support export of filtered contact lists.
- Track per-contact device registrations (iOS/Android) with platform, OS version, and app version.
- Track email reachability status: valid, bounced, invalid, blocked, spam-reported.
- Display a per-contact timeline of tracked events.
- Allow individual contact creation via form.
- Advanced filtering with AND/OR logic across attributes, events, segments, and device data.

#### 8.2.3. Customer Profiles

- **Profile Construction:** Customer profiles are built and continuously enriched from the stream of Oval events (e.g., a `purchase` event updates the customer's purchase history and lifetime value).
- **Profile Storage:** Profiles are stored in PostgreSQL for fast querying, segmentation, and campaign targeting.
- **Profile Attributes:** Each profile aggregates demographic data, behavioral signals, preferences, and computed attributes derived from Oval event parameters.
- **Real-Time Updates:** Profiles are updated in near real-time as new events arrive from Oval.

#### 8.2.4. Audience Segmentation

- **Static Segments:** Manually defined lists; contacts added via upload or UI.
- **Dynamic Segments:** Rule-based segments that auto-update based on filter criteria (attributes, events, devices, Oval event parameters). Re-evaluated automatically as new events arrive.
- **Rule-Based Filters:** Marketers can create segments using filters on profile attributes and event history (e.g., "users who triggered `purchase` event in the last 30 days with `category = electronics`").
- Tag segments for organization.
- Show estimated audience size before finalizing.
- Refresh contact count on demand.
- Export segment contact lists.
- Delete segments (with confirmation if used in active campaigns).
- Segments are available as targeting criteria when creating campaigns, journey triggers, and for analytics breakdowns.

**Acceptance Criteria:**
- A user can upload a CSV and have contacts upserted without duplicates (resolved by email → phone → contact_id).
- Filtering returns a paginated, accurate contact list within 3 seconds for datasets up to 1M contacts.
- Each contact detail page shows profile, devices, custom attribute values, and recent events.
- PII fields (email, phone, name) are hidden for users with PII restrictions enabled.
- A dynamic segment created with filter rules populates correctly when contact data changes.
- Segment contact count refresh completes within 30 seconds for segments up to 500K contacts.

---

### 8.3. Attributes & Events

Define the data schema for contacts — what properties to track and what behaviors to record.

#### Attributes

- **Default attributes:** System-defined fields (email, phone, name, birthday, location, etc.) — read-only definitions.
- **Custom attributes:** Account-defined fields with types: string, number, boolean, date.
- Attributes are tagged by source (API, email, mobile SDK, web).
- CRUD operations for custom attributes (create, edit, delete).
- Grouped view by category for discoverability.

#### Events

- **Default events:** System-defined behavioral events (e.g., `email_sent`, `email_opened`, `purchase`) — read-only definitions.
- **Custom events:** Account-defined events with optional parameters.
- Event parameters support predefined value lists or free-form values.
- Event metadata stored as JSON for flexible payloads.
- CRUD operations for custom event types.
- Grouped view by category.

**Acceptance Criteria:**
- A custom attribute created via the UI becomes available in segment filter rules and contact detail views.
- A custom event type created via the UI can receive data via the Ingest API.
- Deleting a custom attribute or event type does not silently corrupt existing contact data (confirmed deletion warning required).

---

### 8.4. Ingest API

Authenticated REST API for syncing contact data from upstream systems (e.g., Kompas.id SSO, Oval).

**Endpoint:** `POST /api/v1/contacts/ingest`  
**Authentication:** Bearer token (per-account API token)

- Upsert contacts resolved by: `email` → `phone` → `contact_id` (in priority order).
- Accept and store default contact fields (name, email, phone, birthday, location, etc.).
- Accept and store custom attribute values (auto-create attribute definition if not yet present).
- Assign contacts to one or more static segments by segment ID.
- Return meaningful error responses for malformed payloads.
- API token management in the UI: generate, rotate, copy.

**Acceptance Criteria:**
- Ingesting 10,000 contacts via a single API call completes without timeout.
- Contacts ingested with `email` matching an existing record update the record rather than create a duplicate.
- A new custom attribute key in the payload auto-creates the attribute definition for the account.
- Rotating an API token immediately invalidates the old token.

---

### 8.5. Journey Orchestration

Multi-step, multi-channel campaign automation enabling marketers to design and deploy customer journeys triggered by specific events or schedules.

#### 8.5.1. Email Sequences

- **Drip Campaigns:** Marketers can configure time-based email sequences (e.g., welcome series, onboarding flows, re-engagement).
- **Template Management:** Reusable email templates with dynamic personalization using customer profile data.
- **Scheduling:** Emails can be sent immediately, delayed by a configurable duration, or scheduled at a specific date/time.

#### 8.5.2. Multi-Channel Campaigns

- **Supported Channels:** Email, push notification, in-app banner, and web banner (via OASIS-DELIVERY API).
- **Channel Coordination:** A single journey can combine multiple channels in sequence or in parallel (e.g., email → wait 2 days → push notification).
- **Fallback Logic:** If a primary channel fails delivery or goes unread, the system can automatically route the message to a fallback channel.

#### 8.5.3. Trigger-Based Automations

- **Event Triggers:** Journeys can be initiated by Oval events and their parameters in real-time (e.g., `sign_up`, `purchase`, `cart_abandonment`, or any custom event). Marketers can filter triggers by event parameters (e.g., trigger only when `purchase.value > 500000`).
- **Condition Nodes:** Journey flows support conditional branching based on profile attributes, event parameters, segment membership, or prior engagement.
- **Rate Limiting & Quiet Hours:** Safeguards to prevent over-messaging, including per-user rate limits and configurable quiet-hour windows.

---

### 8.6. Reporting & Data

Real-time and historical analytics to measure campaign and delivery performance across all channels.

#### 8.6.1. Analytics Dashboard Overview

- Summary counts: total contacts, total devices, total events, total segments.
- Contact reachability distribution (valid, bounced, blocked, invalid, spam, unset).
- Device platform distribution (iOS vs Android).
- Active vs. inactive device counts.
- Top event types by frequency (last N days).
- Events over time — line chart for the last 14 days.
- Opt-in preference breakdown.
- Recent events feed (latest activity across all contacts).
- Day-over-day trend indicators (events today vs. yesterday).

#### 8.6.2. Impressions Tracking

- **Banner Impressions:** Every banner served via OASIS-DELIVERY logs an impression event asynchronously (to avoid impacting delivery latency).
- **Deduplication:** Configurable deduplication rules (e.g., one impression per user per session).
- **Breakdown Dimensions:** Impressions can be sliced by campaign, placement, device type, geography, and audience segment.

#### 8.6.3. Click-Through Rate (CTR)

- **Click Tracking:** All banner and email interactions tracked via redirect URLs or client-side event reporting.
- **CTR Calculation:** Automatically calculated as `clicks / impressions`, displayed at campaign, journey, and channel level.
- **A/B Comparison:** Side-by-side CTR comparison for campaigns with multiple creative variants.

#### 8.6.4. Conversion Tracking

- **Conversion Events:** Marketers define conversion goals by mapping them to specific Oval events and parameters (e.g., a `purchase` event with `value > 0` counts as a conversion).
- **Attribution:** Last-click attribution model for MVP, linking a conversion to the originating campaign or journey step.
- **Conversion Funnel:** Visual funnel view showing impression → click → conversion drop-off rates.

#### 8.6.5. Real-Time Dashboards

- **Live Metrics:** Dedicated dashboard page displaying live impressions, clicks, CTR, and conversions with auto-refresh (WebSocket or polling).
- **Time Range Filters:** Today, last 7 days, last 30 days, or custom date ranges.
- **Campaign-Level Detail:** Drill-down from aggregate metrics into individual campaign and journey performance.
- **Export:** CSV/Excel export of dashboard data for offline analysis and stakeholder reporting.

**Acceptance Criteria:**
- Dashboard loads within 3 seconds for accounts with up to 1M contacts.
- All charts reflect data as of the last completed database operation (no stale cache beyond 5 minutes).

---

### 8.7. User & Account Management

Manage platform access, roles, and multi-account configurations.

- Super admins can create and enable/disable accounts.
- Admins can invite users to their account via email with role assignment.
- Invitations are token-based with expiration.
- Users accepting an invitation set their own password.
- Admins can resend invitations.
- Users can be assigned PII access restrictions.
- Each user sees only the accounts they are members of.
- Account switching via an account selection screen.

**Acceptance Criteria:**
- An invited user receives an email, clicks the link, sets a password, and lands in the correct account.
- A user with PII restrictions cannot see email, phone, or name fields in any contact view.
- Disabling an account blocks all logins and API access for that account immediately.

---

### 8.8. API Settings

Allow admins to manage API credentials for the Ingest API.

- Display current API token (masked by default).
- Generate or rotate token with one click.
- Copy token to clipboard.
- Animated reveal/hide of token value.

---

## 9. Data Model Summary

| Entity | Purpose |
|---|---|
| `accounts` | Top-level tenant — all data is scoped here |
| `contacts` | Individual customer records |
| `segments` | Named groups of contacts (static or dynamic) |
| `contact_attributes` | Attribute schema definitions (default + custom) |
| `contact_custom_values` | EAV values for custom attributes per contact |
| `event_types` | Event schema definitions (default + custom) |
| `contact_events` | Timestamped event records per contact |
| `contact_devices` | Mobile device registrations per contact |
| `campaigns` | Campaign configurations (banner, email, in-app) |
| `creatives` | Banner creative assets per campaign |
| `campaign_audiences` | Pivot — which segments/contacts receive a campaign |
| `users` | Platform operators |
| `user_account_access` | Many-to-many user↔account membership with roles |
| `user_invitations` | Pending invites with tokens and expiry |
| `tags` | Polymorphic labels for segments, campaigns, attributes |

---

## 10. Out of Scope (v1)

- Push notification delivery infrastructure.
- SMS campaign support.
- A/B testing or multivariate campaign experiments.
- Real-time event streaming or webhooks (outbound).
- Self-service onboarding / account registration (accounts created by super admin only).
- Public-facing API documentation portal.
- Native mobile app for operators.
- Oasis is **not** a send/delivery engine for email — it manages campaign configuration and audiences, not actual message dispatch infrastructure (for MVP).
- Oasis does **not** replace a CRM for sales workflows (no deal tracking, pipeline management, etc.).
- Oasis does **not** provide real-time streaming analytics; dashboards reflect near-real-time aggregated state.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | What is the expected peak ingest volume (contacts/hour) to size queue workers? | Engineering | Open |
| 2 | Should dynamic segments re-evaluate continuously or on a scheduled refresh? | Product | Open |
| 3 | Is campaign email delivery (actual send) in scope for a future phase, or handled by an external system? | Product | Open |
| 4 | What SLA is required for the ingest API (uptime, latency)? | Engineering | Open |
| 5 | Should deleted custom attributes hard-delete or soft-delete historical values? | Engineering | Open |
| 6 | What is the OBS bucket region? *(Assumed `ap-southeast-3` — confirm.)* | Engineering | **Resolved: ap-southeast-3** |
| 7 | What is the OBS bucket name? | Engineering | **Resolved: `assets-oasis`** |

---

## 12. Success Metrics

| Metric | Target |
|---|---|
| Ingest API uptime | ≥ 99.5% monthly |
| Contact list page load time | < 3s (p95) |
| Segment creation to first use | < 5 minutes (self-serve, no engineering) |
| Campaign creation time | < 10 minutes for a new in-app campaign |
| Dashboard load time | < 3s (p95) |
| User invitation acceptance rate | > 80% within 48 hours |
| Banner delivery latency (p95) | < 1ms (Redis cache hit) |
| Delivery API traffic capacity | ≥ 50,000 RPS on single Redis instance |

---

*Document maintained by the OASIS product team. For questions, open an issue in the project repository.*
