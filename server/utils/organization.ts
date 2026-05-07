import type { H3Event } from 'h3'

export const isSuperAdmin = (event: H3Event): boolean => {
  const config = useRuntimeConfig()
  if (!config.superAdminEnabled) return false

  const adminHeader = getHeader(event, 'x-oasis-super-admin')
  return adminHeader === config.superAdminToken
}

export const getOrganizationId = (event: H3Event): string | null => {
  // 1. Priority: x-oasis-organization header
  const orgHeader = getHeader(event, 'x-oasis-organization') || null
  if (orgHeader) {
    return orgHeader
  }

  // 2. Priority: oasis_org_id cookie
  const orgCookie = getCookie(event, 'oasis_org_id')
  if (orgCookie) {
    return orgCookie
  }

  // 3. Fallback for Super Admin
  if (isSuperAdmin(event)) {
    return null
  }

  // 4. Default Fallback
  const config = useRuntimeConfig()
  return (config.public.defaultOrganizationId as string) || null
}

export const requireOrganizationId = (event: H3Event): string => {
  const organizationId = getOrganizationId(event)

  if (!organizationId) {
    throw createError({
      statusCode: 400,
      message: 'Organization context is missing. Please provide x-oasis-organization header.'
    })
  }

  return organizationId
}
