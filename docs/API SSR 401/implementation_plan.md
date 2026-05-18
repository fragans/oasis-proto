# Comprehensive Plan: Campaign Wizard & REST API SSR 401 Unauthorized Fix (Option A)

Resolve the `401 Unauthorized` / `Server Error` returned during Server-Side Rendering (SSR) for internal API endpoints. By auditing all REST API calls, we have identified two instances where raw `$fetch` calls are made within `useAsyncData` without cookie forwarding.

We will fix both instances along with the dynamic route rule collision.

---

## Proposed Changes

### 1. Nuxt Configuration (Route Rule Collision)

#### [MODIFY] [nuxt.config.ts](file:///Users/surya/kompas/oasis-dashboard/nuxt.config.ts)

Add an explicit `/api/**` exclusion **before** the dynamic `/[org]/**` rule. This stops Nitro matching `"api"` as a dynamic organization slug.

```diff
  routeRules: {
    '/login': { auth: 'guest' },
    '/no-organization': { auth: 'user' },
    '/initiate-organization': { auth: 'user' },
    '/organizations/select': { auth: 'user' },
+   '/api/**': { auth: false },          // API routes are guarded programmatically; exclude from page-level routing auth
    // All organization-context routes are protected
    '/[org]/**': { auth: 'user' },
    '/workflow': { auth: 'user' }
  },
```

---

### 2. Campaign Wizard Composable (Header Forwarding)

#### [MODIFY] [useWizardDraft.ts](file:///Users/surya/kompas/oasis-dashboard/app/composables/useWizardDraft.ts)

Extract request cookies using Nuxt's `useRequestHeaders` helper and pass them to the server-side `$fetch` callback inside `useAsyncData`.

```diff
  import type { Campaign } from '~~/shared/types/campaign'
  
  export function useWizardDraft(campaignId: string) {
    const { session } = useUserSession()
    const activeOrgId = computed(() => session.value?.activeOrganizationId)
+   const headers = useRequestHeaders(['cookie'])
  
    const { data: campaign, refresh, error } = useAsyncData(
      `campaign-${campaignId}`,
-     () => $fetch<Campaign>(`/api/campaigns/${campaignId}`),
+     () => $fetch<Campaign>(`/api/campaigns/${campaignId}`, { headers }),
      {
        watch: [activeOrgId]
      }
    )
  
    // ... rest of composable unchanged
  }
```

---

### 3. Team Settings Slideover (Header Forwarding)

#### [MODIFY] [CreateUserSlideover.vue](file:///Users/surya/kompas/oasis-dashboard/app/components/user/CreateUserSlideover.vue)

Forward browser session cookies during SSR for the organization list fetch inside `CreateUserSlideover.vue`. This fixes the same 401 issue when loading the Team Settings `/settings/team` page directly.

```diff
  const props = defineProps<{
    open: boolean
  }>()
  
  const emit = defineEmits(['update:open', 'success'])
  
  const toast = useToast()
  interface Organization {
    id: string
    name: string
  }
  
- const { data: orgsResponse } = await useAsyncData('organizations-list', () => $fetch<{ organizations: Organization[] }>('/api/organizations'))
+ const { data: orgsResponse } = await useAsyncData('organizations-list', () => $fetch<{ organizations: Organization[] }>('/api/organizations', {
+   headers: useRequestHeaders(['cookie'])
+ }))
  const organizations = computed(() => orgsResponse.value?.organizations || [])
```

---

## Verification Plan

### Automated Diffs and Lints
- Run `npm run lint` to verify that all imports, types, and formatting comply with guidelines.

### Manual Verification
1. Run `npm run dev`.
2. **Campaign Wizard**: Access the On-Site Messages campaign wizard and confirm the Template step loads successfully. Force-reload the page to trigger SSR and ensure no 401 console logs or terminal warnings occur.
3. **Team Settings**: Access the `/settings/team` page (as Super Admin). Force-reload the page (triggering SSR of the page + the embedded slideover). Confirm that the organization dropdown loads without throwing any 401 error.
