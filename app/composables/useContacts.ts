import type { ContactListResponse, ContactListQuery } from '~~/shared/types/contact'

export function useContacts() {
  const filters = reactive({
    search: '',
    tags: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const query = computed(() => {
    const q: ContactListQuery = {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    }
    if (filters.search) q.search = filters.search
    if (filters.tags) q.tags = filters.tags
    return q
  })

  const { data, status, refresh } = useFetch<ContactListResponse>('/api/contacts', {
    query,
    watch: [query]
  })

  const contacts = computed(() => data.value?.contacts || [])
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
    contacts,
    total,
    loading,
    refresh,
    updateFilters,
    changePage
  }
}
