export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Skip if we are on the initiate-organization page
  if (to.path === '/initiate-organization') {
    return
  }

  const { allOrganizations, activeOrgId, refresh, status } = useOrganization()

  // 2. Only fetch organizations if they aren't already loaded
  // This prevents redundant /api/organizations calls on every internal route change
  try {
    if (status.value !== 'success' || allOrganizations.value.length === 0) {
      await refresh()
    }
    if (allOrganizations.value.length === 0 && status.value === 'success') {
      return navigateTo('/initiate-organization')
    }

    // 3. Ensure activeOrgId is settled
    const firstOrg = allOrganizations.value[0]
    if (!activeOrgId.value && firstOrg) {
      activeOrgId.value = firstOrg.id
    }
  } catch (err) {
    console.error('[Middleware] Failed to initialize organizations:', err)
  }
})
