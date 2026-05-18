# Guide to QA & Testing Oasis Campaigns and Creatives on the Web

Oasis campaigns and creatives are **fully ready for real-time testing** in the staging environment. Both the multi-tenant `oasis-dashboard` (with the fixed Creative Picker) and the high-performance `oasis-edge` worker are fully functional and integrated with Cloudflare KV.

---

## 1. Verified Active Campaign in Staging KV

We have verified that a test campaign is already synchronized and active in the staging Cloudflare KV namespace (`164df3285e3443dc938ee05b9f7eeb83`) under the `kompasid-dev` organization:

| Field | Details |
| :--- | :--- |
| **Campaign ID** | `b4faf834-3f3a-4445-8a6f-19666ac178a2` |
| **Campaign Name** | `"su camp ekonomi"` |
| **Campaign Type** | `popup` |
| **Target URL Rule** | Path contains `/kategori/ekonomi` |
| **Trigger Logic** | Scroll depth $\ge$ **75%** |
| **Goal Track CSS Selector** | `[data-oasis-goal="click"]` |
| **Goal Destination** | `https://example.com` |
| **Test Mode (`isTestMode`)** | `true` (QA Gate enabled) |

---

## 2. Step-by-Step QA & Testing Guide

Because all staging/draft campaigns have `isTestMode: true` enabled by default to prevent leaking draft content to the public, you must use a QA cookie gate to view and test campaigns.

### Step 1: Create or Edit a Campaign in the Dashboard
1. Open the **Oasis Dashboard** UI.
2. Ensure you are under the correct organization context (e.g. `kompasid-dev` using the [Organization Switcher](file:///Users/surya/kompas/oasis-dashboard/app/components/organization/OrganizationSwitcher.vue)).
3. Use the **5-Step Campaign Wizard** to create your campaign or select an existing one:
   - **Template & Creative:** Choose your layout and select assets seamlessly using the reactive [Creative Picker](file:///Users/surya/kompas/oasis-dashboard/app/components/creative/CreativePickerModal.vue).
   - **Targeting Rules:** Set targeting paths (e.g., matching certain sections/URLs).
   - **Trigger Mode:** Set to `Immediate`, `Scroll` (enter percentage), or `Exit-Intent`.
   - **Goal Selectors:** Set up tracking selectors.
   - **Review & Launch:** Drizzle ORM will persist it, and the sync engine in [kv-sync.ts](file:///Users/surya/kompas/oasis-dashboard/server/utils/kv-sync.ts) will automatically write the campaign to Cloudflare KV in real-time.

### Step 2: Open the Target Web Page
Go to the targeted URL on the staging domain. For the active test campaign, open:
👉 **`https://www.kompas.cloud/kategori/ekonomi`**

### Step 3: Activate the QA Test Cookie
Open your browser's Developer Tools Console (`F12` or `Option + Cmd + I` on macOS) and run the following command to set the QA cookie:

```javascript
document.cookie = "oasis_test=1; path=/; domain=.kompas.cloud";
```

> [!TIP]
> This cookie acts as a master key for the Cloudflare Worker [index.ts](file:///Users/surya/kompas/oasis-edge/src/index.ts) at the edge. The worker reads the `oasis_test=1` cookie and knows to inject campaigns marked with `isTestMode: true` into the HTML page.

### Step 4: Refresh and Trigger the Campaign
1. **Refresh the page** after setting the cookie.
2. Fulfill the trigger condition:
   - For a **Scroll** trigger (like `su camp ekonomi`), scroll down past **75%** of the page depth.
   - For an **Exit-Intent** trigger, move your mouse cursor outside the top of the viewport (simulating closing the tab).
   - For **Immediate** trigger, it will load immediately after DOM content is ready.
3. The campaign popup or creative will render in the web browser dynamically with zero latency!

---

## 3. How to Verify Analytics & Impression Tracking

When the campaign is shown to the user, the edge-injected trigger engine script in [rewriter.ts](file:///Users/surya/kompas/oasis-edge/src/core/rewriter.ts) automatically fires tracking signals.

To verify that analytics are working:
1. Open the **Network Tab** in Developer Tools.
2. Trigger the campaign.
3. Look for outbound requests:
   - **OVAL SDK:** You should see requests tracking impressions back to the OVAL platform via `window.oval.track("show_osm", { "Campaign ID": "..." })`.
   - **Oasis Ingest API:** Click the call-to-action button in the creative popup to fire a Beacon request to `https://www.kompas.cloud/ingest/engagement` verifying the click goal was successfully recorded.

> [!IMPORTANT]
> To view active deployment roadmaps and other technical specs, consult the compiled wiki files [roadmap.md](file:///Users/surya/Documents/My%20Drive/oasis-wiki/wiki/projects/oasis/roadmap.md) and [oval-integration-strategy.md](file:///Users/surya/Documents/My%20Drive/oasis-wiki/wiki/concepts/oval-integration-strategy.md).
