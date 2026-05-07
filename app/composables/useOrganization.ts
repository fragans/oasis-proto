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
  // This ensures the first API call always has an org context
  if (!activeOrgId.value && config.public.defaultOrganizationId) {
    activeOrgId.value = config.public.defaultOrganizationId as string
  }

  const { data: orgData, status, refresh } = useLazyAsyncData('organizations', () =>
    $fetch<{ organizations: Organization[] }>('/api/organizations', {
      headers: useRequestHeaders()
    })
  )

  const allOrganizations = computed(() => orgData.value?.organizations || [])

  // Handle default selection if cookie is empty
  watch(allOrganizations, (newOrgs) => {
    const firstOrg = newOrgs[0]
    if (!activeOrgId.value && firstOrg) {
      activeOrgId.value = firstOrg.id
    }
  }, { immediate: true })

  const currentOrganization = computed(() =>
    allOrganizations.value.find(org => org.id === activeOrgId.value) || null
  )

  const switchOrganization = (orgId: string) => {
    activeOrgId.value = orgId
    // Full reload as per user decision for absolute data isolation
    window.location.reload()
  }

  return {
    allOrganizations,
    currentOrganization,
    activeOrgId,
    isSuperAdmin,
    status,
    refresh,
    switchOrganization
  }
}
