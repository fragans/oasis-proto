import type { H3Event } from 'h3'

export const getOrganizationId = (event: H3Event): string | null => {
  const isSuperAdmin = getHeader(event, 'x-oasis-super-admin') === 'true'
  if (isSuperAdmin) return null

  return getHeader(event, 'x-oasis-organization') || null
}

export const requireOrganizationId = (event: H3Event): string => {
  const organizationId = getOrganizationId(event)
  // If it's a super admin, they might not have a specific organization context
  // but for specific actions (like creating a campaign), they might still need to provide one via header
  if (!organizationId && getHeader(event, 'x-oasis-super-admin') !== 'true') {
    throw createError({
      statusCode: 400,
      message: 'Organization ID is required. Please provide x-oasis-organization header.'
    })
  }

  return organizationId!
}
