import type { JourneyStatus, JourneyListResponse } from '~~/shared/types/journey'

export function useJourneys() {
  const filters = reactive({
    status: '' as JourneyStatus | '',
    search: '',
    page: 1,
    limit: 20,
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const query = computed(() => {
    const q: Record<string, unknown> = {
      page: filters.page,
      limit: filters.limit,
      sortOrder: filters.sortOrder
    }
    if (filters.status) q.status = filters.status
    if (filters.search) q.search = filters.search
    return q
  })

  const { data, status, refresh } = useFetch<JourneyListResponse>('/api/journeys', {
    query,
    watch: [query]
  })

  const journeys = computed(() => data.value?.journeys || [])
  const total = computed(() => data.value?.total || 0)
  const loading = computed(() => status.value === 'pending')

  function updateFilters(newFilters: Partial<typeof filters>) {
    Object.assign(filters, newFilters)
    filters.page = 1
  }

  function changePage(page: number) {
    filters.page = page
  }

  return {
    filters,
    journeys,
    total,
    loading,
    refresh,
    updateFilters,
    changePage
  }
}
