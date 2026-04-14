import type { EmailTemplateListResponse, EmailTemplate } from '~~/shared/types/journey'

export function useEmailTemplates() {
  const filters = reactive({
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
    if (filters.search) q.search = filters.search
    return q
  })

  const { data, status, refresh } = useFetch<EmailTemplateListResponse>('/api/templates', {
    query,
    watch: [query]
  })

  const templates = computed(() => data.value?.templates || [])
  const total = computed(() => data.value?.total || 0)
  const loading = computed(() => status.value === 'pending')

  async function fetchTemplate(id: string) {
    return $fetch<EmailTemplate>(`/api/templates/${id}`)
  }

  async function createTemplate(data: {
    name: string
    subject: string
    bodyHtml: string
    bodyText?: string
    variables?: string[]
    category?: string
  }) {
    return $fetch('/api/templates', {
      method: 'POST',
      body: data
    })
  }

  async function updateTemplate(id: string, data: Record<string, unknown>) {
    return $fetch(`/api/templates/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function deleteTemplate(id: string) {
    return $fetch(`/api/templates/${id}`, {
      method: 'DELETE'
    })
  }

  return {
    filters,
    templates,
    total,
    loading,
    refresh,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
  }
}
