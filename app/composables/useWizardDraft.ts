import type { Campaign } from '~~/shared/types/campaign'

export function useWizardDraft(campaignId: string) {
  const { activeOrgId } = useOrganization()

  // Used for server-side fetching (SSR): forwards the cookie + org headers
  // useRequestHeaders only has values in an SSR context; on the client it returns {}
  const ssrHeaders = computed(() => ({
    ...useRequestHeaders(['cookie', 'x-oasis-organization', 'x-oasis-super-admin']),
    ...(activeOrgId.value ? { 'x-oasis-organization': activeOrgId.value } : {})
  }))

  // Used for client-side mutations: browser sends cookie automatically,
  // we just need to pass the org context header
  const clientHeaders = computed(() => ({
    ...(activeOrgId.value ? { 'x-oasis-organization': activeOrgId.value } : {})
  }))

  const { data: campaign, refresh, error } = useAsyncData(
    `campaign-${campaignId}`,
    () => $fetch<Campaign>(`/api/campaigns/${campaignId}`, {
      headers: ssrHeaders.value
    }),
    {
      watch: [ssrHeaders]
    }
  )

  const saving = ref(false)

  async function patch(partial: Partial<Campaign>) {
    saving.value = true
    try {
      const result = await $fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: partial,
        headers: clientHeaders.value
      })
      await refresh()
      return result
    } finally {
      saving.value = false
    }
  }

  return {
    campaign,
    refresh,
    error,
    patch,
    saving
  }
}
