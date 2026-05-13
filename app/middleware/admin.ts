export default defineNuxtRouteMiddleware(() => {
  const { isAdmin } = useRole()

  if (!isAdmin.value) {
    return navigateTo('/campaigns/on-site-messages')
  }
})
