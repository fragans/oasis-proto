export default defineNuxtRouteMiddleware((to) => {
  const { isAdmin } = useRole()
  const org = to.params.org
  console.log('admin midd')

  if (!isAdmin.value) {
    const orgCookie = useCookie('oasis_org_id')
    const prefix = org ? `/${org}` : orgCookie.value
    return navigateTo(`${prefix}/campaigns/on-site-messages`)
  }
})
