# Oasis Project Overview

Oasis is a Customer Engagement and Data Platform (CDP) designed for multi-tenant campaign management and personalized content delivery at the edge.

## Architecture

The project is split into two main repositories:
1. **oasis-proto**: The administrative dashboard and core data platform.
2. **oasis-edge**: The high-performance personalization engine running at the edge.

---

## 1. Oasis Dashboard & CDP (`oasis-proto`)

A full-stack application built with **Nuxt 4** and **Nuxt UI**, serving as the central workspace for marketers.

### Core Technologies
- **Frontend**: Vue 3, Nuxt 4, Nuxt UI, TailwindCSS.
- **Backend Engine**: Nitro.
- **Database**: PostgreSQL with **Drizzle ORM**.
- **Edge Sync**: Cloudflare KV (via REST API).
- **Storage**: AWS S3 (for creatives).
- **Validation**: Zod.

### Key Functional Modules
- **Campaign Management**: Supports various campaign types (sticky, in-article, popup) with status lifecycle (draft, active, etc.) and targeting rules.
- **CDP (Customer Data Platform)**:
    - **Contacts**: Centralized store for customer profiles, including external IDs, demographics, and tags.
    - **Attributes**: Extensible schema with custom attributes (string, number, boolean, date).
    - **Events**: Behavioral tracking system for logging customer actions with JSON metadata.
- **Segments**: Static (manual) and Dynamic (rule-based) audience grouping.
- **Journey Orchestration**: A visual workflow engine for creating multi-step customer journeys using triggers, actions (email, push, banner), and conditional splits.
- **Multi-Tenancy**: Scoped data access via a dedicated `tenants` system.
- **Asset Management**: Integrated creative upload and management system.

---

## 2. Oasis Edge (`oasis-edge`)

A high-speed personalization and delivery engine running on **Cloudflare Workers**.

### Core Technologies
- **Runtime**: Cloudflare Workers (Wrangler).
- **Personalization**: HTML Rewriter for DOM-based content injection.
- **Data Source**: Cloudflare KV for rapid configuration retrieval.

### Processing Pipeline
1. **Tenant Resolution**: Identifies the tenant based on the request hostname.
2. **User Identification**: Manages user identity via GUIDs stored in cookies.
3. **Personalization Fetch**: Retrieves active campaigns and user segments from the edge cache.
4. **Dynamic Filtering**: Filters campaigns based on user segments, geo-location, device type, and URL path.
5. **HTML Transformation**: Intercepts the origin response and uses `HTMLRewriter` to inject personalized campaign content (banners, popups) directly into the HTML stream.
6. **Testing Gate**: Includes a "Test Mode" toggle via cookies to allow QA of inactive campaigns.

---

## Data Model Highlights (from `schema.ts`)
- **Tenants**: Manages hostname mapping and live status.
- **Campaigns**: Stores delivery configurations, HTML content, and targeting logic.
- **Contacts & Devices**: Tracks unique users and their associated platforms/push tokens.
- **Journeys**: Defines complex orchestration nodes and edges for automated engagement.
- **API Tokens**: Manages secure access for external data ingestion.
