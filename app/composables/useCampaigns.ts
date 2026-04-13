import type { CampaignStatus, CampaignListResponse } from '~~/shared/types/campaign'

export function useCampaigns() {
  const filters = reactive({
    status: '' as CampaignStatus | '',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const query = computed(() => {
    const q: Record<string, any> = {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    }
    if (filters.status) q.status = filters.status
    if (filters.search) q.search = filters.search
    return q
  })

  const { data, status, refresh } = useFetch<CampaignListResponse>('/api/campaigns', {
    query,
    watch: [query]
  })

  const campaigns = computed(() => data.value?.campaigns || [])
  const total = computed(() => data.value?.total || 0)
  const loading = computed(() => status.value === 'pending')

  function updateFilters(newFilters: Partial<typeof filters>) {
    Object.assign(filters, newFilters)
    filters.page = 1
  }

  function changePage(page: number) {
    filters.page = page
  }

  function changeSort(sortBy: string) {
    if (filters.sortBy === sortBy) {
      filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      filters.sortBy = sortBy
      filters.sortOrder = 'desc'
    }
  }

  return {
    filters,
    campaigns,
    total,
    loading,
    refresh,
    updateFilters,
    changePage,
    changeSort
  }
}
