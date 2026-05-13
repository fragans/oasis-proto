import { eq } from 'drizzle-orm'
import { organization } from '../database/schema'
import type { H3Event } from 'h3'

/**
 * Checks if the current session user is a Super Admin.
 */
export const isSuperAdmin = async (event: H3Event): Promise<boolean> => {
  const auth = serverAuth(event)
  const session = await auth.api.getSession({ headers: event.headers }) as {
    user: { role?: string }
    session: { activeOrganizationId?: string | null }
  } | null

  return session?.user.role === 'super_admin'
}

/**
 * Resolves the current organization ID from the Better Auth session.
 *
 * Returns:
 * - The activeOrganizationId from the session if set.
 * - null for Super Admins with no active organization (Global View).
 * - null for regular users with no active organization (will be handled by requireOrganizationId).
 */
export const getOrganizationId = async (event: H3Event): Promise<string | null> => {
  const auth = serverAuth(event)
  const session = await auth.api.getSession({ headers: event.headers }) as {
    user: { role?: string }
    session: { activeOrganizationId?: string | null }
  } | null

  // 1. Priority: Better Auth Active Organization from the session
  if (session?.session.activeOrganizationId) {
    return session.session.activeOrganizationId
  }

  // 2. Fallback: Super Admin Context (Browsing Mode)
  if (session?.user.role === 'super_admin') {
    // A. Check for explicit route param or query param
    let orgSlug = getRouterParam(event, 'org') || getQuery(event).orgSlug as string

    // B. Check for Referer (helpful for API calls made from a tenant page like /[org]/campaigns)
    if (!orgSlug) {
      const referer = getRequestHeader(event, 'referer')
      if (referer) {
        try {
          const url = new URL(referer)
          const parts = url.pathname.split('/').filter(Boolean)
          const firstPart = parts[0]
          // If the first part of the path is likely an org slug (not a reserved route)
          if (firstPart && !['login', 'organizations', 'no-organization', 'initiate-organization'].includes(firstPart)) {
            orgSlug = firstPart
          }
        } catch (e: unknown) {
          console.error(e instanceof Error ? e.message : 'Invalid referer URL')
          // Ignore invalid referer URLs
        }
      }
    }

    if (orgSlug) {
      const db = useDB()
      const org = await db.select().from(organization).where(eq(organization.slug, orgSlug)).limit(1)
      if (org[0]) {
        return org[0].id
      }
    }
    return null
  }

  return null
}

/**
 * Ensures an organization context is present, otherwise throws a 400 error.
 * Super Admins are exempt from this requirement (they default to Global View).
 */
export const requireOrganizationId = async (event: H3Event): Promise<string> => {
  const organizationId = await getOrganizationId(event)

  if (!organizationId) {
    // If not a super admin and no org ID, we must block.
    if (!(await isSuperAdmin(event))) {
      throw createError({
        statusCode: 400,
        message: 'Organization context is missing. Please select an organization.'
      })
    }
    // For Super Admins, return null if no org is active (interpreted as "all" in queries)
    return null as unknown as string
  }

  return organizationId
}

/**
 * Ensures the current user has administrative permissions (admin or super_admin).
 * Throws a 403 Forbidden error if the user is a viewer.
 */
export const requireAdmin = async (event: H3Event) => {
  const session = await requireUserSession(event)
  const role = session.user.role

  if (role !== 'admin' && role !== 'super_admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'You do not have permission to perform this action.'
    })
  }

  return session
}
