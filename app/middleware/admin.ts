export default defineNuxtRouteMiddleware((to) => {
  const org = to.params.org

  if (!org) return

  const { isAdmin } = useRole()

  if (!isAdmin.value) {
    const orgCookie = useCookie('oasis_org_id')
    const prefix = org ? `/${org}` : orgCookie.value
    return navigateTo(`${prefix}/campaigns/on-site-messages`)
  }
})
