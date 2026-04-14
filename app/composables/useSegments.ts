import type { SegmentListResponse } from '~~/shared/types/contact'

export function useSegments() {
  const filters = reactive({
    search: '',
    type: '' as 'static' | 'dynamic' | '',
    page: 1,
    limit: 20
  })

  const query = computed(() => {
    const q: Record<string, unknown> = {
      page: filters.page,
      limit: filters.limit
    }
    if (filters.search) q.search = filters.search
    if (filters.type) q.type = filters.type
    return q
  })

  const { data, status, refresh } = useFetch<SegmentListResponse>('/api/segments', {
    query,
    watch: [query]
  })

  const segments = computed(() => data.value?.segments || [])
  const total = computed(() => data.value?.total || 0)
  const loading = computed(() => status.value === 'pending')

  function updateFilters(newFilters: Partial<typeof filters>) {
    Object.assign(filters, newFilters)
    filters.page = 1
  }

  async function createSegment(data: Record<string, unknown>) {
    return $fetch('/api/segments', { method: 'POST', body: data })
  }

  async function updateSegment(id: string, data: Record<string, unknown>) {
    return $fetch(`/api/segments/${id}`, { method: 'PUT', body: data })
  }

  async function deleteSegment(id: string) {
    return $fetch(`/api/segments/${id}`, { method: 'DELETE' })
  }

  return {
    filters,
    segments,
    total,
    loading,
    refresh,
    updateFilters,
    createSegment,
    updateSegment,
    deleteSegment
  }
}
