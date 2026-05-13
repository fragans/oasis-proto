export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession()
  const isSuperAdmin = computed(() => user.value?.role === 'super_admin')

  if (!isSuperAdmin.value) {
    return navigateTo('/settings')
  }
})
