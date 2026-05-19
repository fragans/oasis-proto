import type { Campaign } from '~~/shared/types/campaign'

export function useWizardDraft(campaignId: string) {
  const { session } = useUserSession()
  const activeOrgId = computed(() => session.value?.activeOrganizationId)
  const headers = useRequestHeaders(['cookie'])

  const { data: campaign, refresh, error } = useAsyncData(
    `campaign-${campaignId}`,
    () => $fetch<Campaign>(`/api/campaigns/${campaignId}`, { headers }),
    {
      watch: [activeOrgId]
    }
  )

  const saving = ref(false)

  async function patch(partial: Partial<Campaign>) {
    saving.value = true
    try {
      const result = await $fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: partial,
        headers
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
