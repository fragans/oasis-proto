import type { H3Event } from 'h3'

export const isSuperAdmin = (event: H3Event): boolean => {
  const config = useRuntimeConfig()
  if (!config.superAdminEnabled) return false

  const adminHeader = getHeader(event, 'x-oasis-super-admin')
  return adminHeader === config.superAdminToken
}

export const getOrganizationId = (event: H3Event): string | null => {
  const orgHeader = getHeader(event, 'x-oasis-organization') || null

  if (isSuperAdmin(event)) {
    // Super-admins can operate globally or within a specific organization context
    return orgHeader
  }

  return orgHeader
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
