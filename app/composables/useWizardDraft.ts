import type { Campaign } from '~~/shared/types/campaign'

export function useWizardDraft(campaignId: string) {
  const { activeOrgId } = useOrganization()
  const fetchHeaders = computed(() => ({
    ...useRequestHeaders(['cookie', 'x-oasis-organization', 'x-oasis-super-admin']),
    ...(activeOrgId.value ? { 'x-oasis-organization': activeOrgId.value } : {})
  }))

  const { data: campaign, refresh, error } = useFetch<Campaign>(`/api/campaigns/${campaignId}`, {
    headers: fetchHeaders
  })

  const saving = ref(false)

  async function patch(partial: Partial<Campaign>) {
    saving.value = true
    try {
      const result = await $fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: partial
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
