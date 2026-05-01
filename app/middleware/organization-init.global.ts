import type { Organization } from '~~/shared/types/organization'

export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Skip if we are on the initiate-organization page or within settings
  if (to.path === '/initiate-organization') {
    return
  }

  // 2. Check if we have organizations
  // We use a simple $fetch to the organizations API
  // In a real app, this should be cached in a shared state or store
  try {
    const { organizations } = await $fetch<{ organizations: Organization[] }>('/api/organizations', {
      // mock req headers for development stage
      headers: useRequestHeaders(['x-oasis-super-admin', 'x-oasis-organization'])
    })
    if (organizations.length === 0) {
      return navigateTo('/initiate-organization')
    }
  } catch (err) {
    console.error('[Middleware] Failed to check organizations:', err)
    // If API fails, we don't want to block the app, but maybe log it
  }
})
