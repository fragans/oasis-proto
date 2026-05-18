export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on the client side to interact with the Better Auth client and session cookies
  const { user, session, client } = useUserSession()

  // 1. Protect routes by redirecting unauthenticated users to login
  const publicPages = ['/login', '/no-organization', '/initiate-organization', '/organizations/select']
  if (!user.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  // 2. Skip further processing if not logged in or on public/infrastructure pages
  if (!user.value || publicPages.includes(to.path)) return

  const isSuperAdmin = user.value.role === 'super_admin'

  // 2. Handle root path redirect
  if (to.path === '/') {
    // We need the client to list organizations. On server, we let it fall through to index.vue
    // which will then trigger this on the client.
    if (import.meta.server || !client) return

    const { data: orgs } = await client.organization.list()

    if (!orgs || orgs.length === 0) {
      return navigateTo(isSuperAdmin ? '/initiate-organization' : '/no-organization')
    }

    // If they have organizations, let them pick
    return navigateTo('/organizations/select')
  }

  // 3. Sync Organization Context via URL [org] parameter
  const orgSlugFromUrl = to.params.org as string
  if (orgSlugFromUrl) {
    const currentActiveOrgSlug = session.value?.activeOrganization?.slug

    if (currentActiveOrgSlug !== orgSlugFromUrl) {
      if (import.meta.server || !client) return

      try {
        // Super Admins bypass setActive membership requirements and rely on Browsing Mode
        if (isSuperAdmin) return

        // Attempt to set the active organization by slug
        const { error } = await client.organization.setActive({
          organizationSlug: orgSlugFromUrl
        })

        if (error) {
          console.warn('Invalid organization slug in URL:', orgSlugFromUrl)
          if (isSuperAdmin) return // Allow Super Admins to continue in "Browsing Mode"
          return navigateTo('/organizations/select')
        }
      } catch (err) {
        console.error('Failed to sync organization context:', err)
        if (isSuperAdmin) return // Allow Super Admins to continue in "Browsing Mode"
        return navigateTo('/organizations/select')
      }
    }
  }
})
