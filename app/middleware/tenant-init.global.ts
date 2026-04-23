import type { Tenant } from '~~/shared/types/tenant'

export default defineNuxtRouteMiddleware(async (to) => {
  // 1. Skip if we are on the initiate-tenant page or within settings
  if (to.path === '/initiate-tenant' || to.path.startsWith('/settings/')) {
    return
  }

  // 2. Check if we have tenants
  // We use a simple $fetch to the tenants API
  // In a real app, this should be cached in a shared state or store
  try {
    const { tenants } = await $fetch<{ tenants: Tenant[] }>('/api/tenants')

    if (tenants.length === 0) {
      return navigateTo('/initiate-tenant')
    }
  } catch (err) {
    console.error('[Middleware] Failed to check tenants:', err)
    // If API fails, we don't want to block the app, but maybe log it
  }
})
