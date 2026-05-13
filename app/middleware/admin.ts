export default defineNuxtRouteMiddleware((to) => {
  const { isAdmin } = useRole()
  const org = to.params.org

  if (!isAdmin.value) {
    const prefix = org ? `/${org}` : ''
    return navigateTo(`${prefix}/campaigns/on-site-messages`)
  }
})
