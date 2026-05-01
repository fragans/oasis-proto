# Project Progress: Automated Versioning & Changelog System

**System Goal:** Implement a zero-toil CI/CD pipeline that automates semantic versioning (SemVer), updates project metadata, and syncs "What's New" content directly to the Neon PostgreSQL database for in-app notifications.

---

## 🟢 Status Legend
- 🟦 **Planned** (To be started)
- 🟨 **In Progress** (Currently active)
- ✅ **Completed** (Finalized and verified)
- 🔴 **Blocked** (Needs intervention)

---

## 🎯 Goal 1: Automated Versioning & Metadata Sync
Automate the release cycle using Conventional Commits and keep the `package.json` in sync.

### 📍 Milestone 1.1: Release Automation Infrastructure
*Core tooling and GitHub Actions setup.*

- **Story: Initialize Semantic Release Suite**
  - [ ] Install `semantic-release` and essential plugins (`commit-analyzer`, `release-notes-generator`).
  - [ ] Install `@semantic-release/npm` and `@semantic-release/git` for `package.json` updates.
  - [ ] Configure `release.config.js` with ESM (`export default`) for `type: module` compatibility.
- **Story: GitHub Actions Pipeline**
  - [ ] Create `.github/workflows/release.yml`.
  - [ ] Configure `GITHUB_TOKEN` permissions (write access for tags/releases).
  - [ ] Add `DATABASE_URL` to GitHub Repository Secrets.

---

## 🎯 Goal 2: Database-Driven "What's New" System
Store release notes in Postgres so they can be queried by the Nuxt 4 frontend.

### 📍 Milestone 2.1: Data Layer & Persistence
*Defining how changelogs live in the database.*

- **Story: Drizzle Schema Definition**
  - [ ] Define `changelogs` table in `server/database/schema.ts`.
  - [ ] Implement `release_type` enum (production, preview, hotfix).
  - [ ] Push schema to Neon using `npx drizzle-kit push`.
- **Story: Automated Sync Script**
  - [ ] Create `scripts/sync-release.ts` using `node:process` for ESM compatibility.
  - [ ] Implement logic to parse Markdown notes into the `notes` column.
  - [ ] Test local execution with `tsx`.

---

## 🎯 Goal 3: In-App User Notifications
Expose the release data to users within the Oasis-Proto dashboard.

### 📍 Milestone 3.1: API & Component Integration
*Fetching and displaying the data.*

- **Story: Nitro API Endpoints**
  - [ ] Create `server/api/updates/latest.get.ts` to fetch recent releases.
  - [ ] Implement caching (SWR) for the updates endpoint to optimize Neon compute hours.
- **Story: Notification UI**
  - [ ] Build a `WhatsNewModal.vue` component.
  - [ ] Add "New Update" indicator logic based on comparing `package.json` version with `localStorage`.
  - [ ] Render Markdown notes safely using a Nuxt-compatible parser.

---

## 🛠 Technical Environment Notes
- **Node Version:** 22+ (Required for `with { type: 'json' }` and `rollup-plugin-visualizer`).
- **Module System:** ESM (`type: module`).
- **TS Config:** Managed via `tsconfig.config.json` for root-level tool typing.
- **Database:** Neon Serverless (PostgreSQL).

---

## 📝 Recent Activity Log
- **2026-04-14:** Initialized `progress.md`.
- **2026-04-14:** Resolved `tsconfig` conflict for `drizzle.config.ts`.
- **2026-04-14:** Finalized Drizzle schema for `changelogs` table.