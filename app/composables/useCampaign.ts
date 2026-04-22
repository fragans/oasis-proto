import type { CampaignStatus, CampaignWithCreatives } from '~~/shared/types/campaign'

export function useCampaign() {
  async function fetchCampaign(id: string) {
    return $fetch<CampaignWithCreatives & { availableTransitions: CampaignStatus[], isEditable: boolean, daysRemaining: number | null }>(`/api/campaigns/${id}`)
  }

  async function createCampaign(data: {
    name: string
    tenantId?: string
    campaignType?: string
    templateType?: string
    description?: string
    objective?: string
    priority?: string
    startDate?: string
    endDate?: string
  }) {
    return $fetch<{ id: string }>('/api/campaigns', {
      method: 'POST',
      body: data
    })
  }

  async function updateCampaign(id: string, data: Record<string, unknown>) {
    return $fetch(`/api/campaigns/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteCampaign(id: string) {
    return $fetch(`/api/campaigns/${id}`, {
      method: 'DELETE'
    })
  }

  async function changeStatus(id: string, status: CampaignStatus) {
    return $fetch(`/api/campaigns/${id}/status`, {
      method: 'PATCH',
      body: { status }
    })
  }

  async function cloneCampaign(id: string) {
    return $fetch(`/api/campaigns/${id}/clone`, {
      method: 'POST'
    })
  }

  return {
    fetchCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    changeStatus,
    cloneCampaign
  }
}
