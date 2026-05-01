# Use Case: Campaigns Management

## Overview
Campaigns Management is the primary functional domain of the Oasis platform. It enables administrators to create, target, and deploy interactive content (sticky banners, popups, in-article widgets) to organization websites with sub-millisecond delivery latency via the Cloudflare Edge.

## Components

### 1. Management Dashboard (`oasis-proto`)
The dashboard provides a 5-step **Campaign Wizard** for high-velocity campaign creation:

*   **Step 1: Template Selection**
    *   **Predefined Templates**: `Promo Code` (floating banners), `Modal with CTA` (fullscreen popups).
    *   **Customization**: Dynamic replacement of variables like `{{promoTitle}}`, `{{ctaLink}}`, and `{{creativeUrl}}`.
*   **Step 2: Targeting Engine**
    *   **Geo-targeting**: Country, Region, City, or Coordinate-based Bounding Boxes.
    *   **Device Context**: Specific delivery to `Mobile`, `Desktop`, or `Tablet`.
    *   **User State**: Delivery based on `Logged-in` vs `Anonymous` status.
    *   **URL Matching**: Page-level targeting using `Equals`, `Starts-with`, `Contains`, or `Regex`.
    *   **GTM Attributes**: Advanced targeting against Google Tag Manager `dataLayer` events and keys.
*   **Step 3: Trigger Logic**
    *   **Immediate**: Shows as soon as the payload is injected.
    *   **Scroll**: Triggers after the user scrolls a specific percentage of the page (e.g., 30%).
    *   **Exit-Intent**: Triggers when the user's cursor moves to leave the browser window.
*   **Step 4: Goal Definition**
    *   Supports `Click` tracking on specific CSS selectors.
    *   Configurable `destinationUrl` for CTA redirection.
*   **Step 5: Launch & Review**
    *   Final validation of targeting and scheduling.
    *   **Test Mode**: Enabling `isTestMode` restricts the campaign to users with the `oasis_test=1` cookie.

### 2. Synchronization Layer
*   **Database**: Campaigns are persisted in Postgres (via Drizzle ORM).
*   **KV Sync**: Upon activation, campaigns are serialized into a lightweight format (`KVCampaign`) and pushed to **Cloudflare KV** (`OASIS_DATA`) partitioned by `organization_id`.

### 3. Personalization Engine (`oasis-edge`)
The Edge Worker intercepts incoming requests and performs real-time personalization:

1.  **KV Fetch**: Retrieves the list of active campaigns for the current organization.
2.  **Server-side Filtering**: Evaluates Geo, Device, and Login rules against the request's Cloudflare metadata and cookies.
3.  **Payload Generation**:
    *   For matching campaigns, the HTML/JS is bundled into a `ClientPayload`.
    *   Rules that require client-side context (like GTM attributes or scroll triggers) are passed as metadata for execution in the browser.
4.  **Injection**: The Worker uses `HTMLRewriter` to inject the payload into the response body.

## Technical Specifications

### Campaign Types
- `sticky`: Fixed position banners (top/bottom).
- `popup`: Centered modals with overlays. [soon]
- `in-article`: Content injected into specific DOM selectors. [soon]

### Status Lifecycle
`Draft` → `Scheduled` → `Active` ↔ `Paused` → `Completed`

---

> [!NOTE]
> This use case was synchronized based on the implementation of the Campaign Wizard refactor completed in April 2026.
