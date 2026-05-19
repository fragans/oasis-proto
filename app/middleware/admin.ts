export default defineNuxtRouteMiddleware((to) => {
  const org = to.params.org

  if (!org) return

  const { isAdmin } = useRole()

  if (!isAdmin.value) {
    return navigateTo(`/${org}/campaigns/on-site-messages`)
  }
})
