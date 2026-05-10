import type { Organization } from '~~/shared/types/organization'

export const useOrganization = () => {
  const isSuperAdmin = useState<boolean>('isSuperAdmin', () => {
    if (import.meta.server) {
      const headers = useRequestHeaders(['x-oasis-super-admin'])
      return !!headers['x-oasis-super-admin']
    }
    return false
  })

  const config = useRuntimeConfig()

  const activeOrgId = useCookie<string | null>('oasis_org_id', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  // Immediately seed from runtimeConfig if cookie is not yet set
  if (!activeOrgId.value && config.public.defaultOrganizationId) {
    activeOrgId.value = config.public.defaultOrganizationId as string
  }

  // Use useAsyncData with a stable key for global caching/deduplication
  const { data: orgData, status, refresh, error } = useAsyncData(
    'organizations',
    () => $fetch<{ organizations: Organization[] }>('/api/organizations', {
      headers: useRequestHeaders(['cookie', 'x-oasis-organization', 'x-oasis-super-admin'])
    })
  )

  const allOrganizations = computed(() => orgData.value?.organizations || [])

  const currentOrganization = computed(() =>
    allOrganizations.value.find(org => org.id === activeOrgId.value) || null
  )

  const switchOrganization = (orgId: string) => {
    activeOrgId.value = orgId
    // Full reload for absolute data isolation as per user preference
    if (import.meta.client) {
      window.location.reload()
    }
  }

  return {
    allOrganizations,
    currentOrganization,
    activeOrgId,
    isSuperAdmin,
    status,
    refresh,
    error,
    switchOrganization
  }
}
