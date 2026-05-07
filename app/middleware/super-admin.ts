export default defineNuxtRouteMiddleware(() => {
  const { isSuperAdmin } = useOrganization()

  if (!isSuperAdmin.value) {
    return navigateTo('/settings')
  }
})
