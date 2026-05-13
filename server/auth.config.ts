import { defineServerAuth } from '@onmax/nuxt-better-auth/config'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { admin, organization } from 'better-auth/plugins'
import { apiKey } from '@better-auth/api-key'
import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements, adminAc, userAc } from 'better-auth/plugins/admin/access'

export default defineServerAuth(() => {
  const db = useDB()
  const ac = createAccessControl(defaultStatements)

  interface SessionWithOrg {
    activeOrganizationId?: string | null
    activeOrganization?: {
      id: string
      name: string
      slug: string | null
    } | null
  }

  return {
    database: drizzleAdapter(db, { provider: 'pg' }),
    hooks: {
      session: {
        get: {
          after: async (session: SessionWithOrg) => {
            if (session.activeOrganizationId) {
              const org = await db.query.organization.findFirst({
                where: (o, { eq }) => eq(o.id, session.activeOrganizationId!)
              })
              if (org) {
                session.activeOrganization = {
                  id: org.id,
                  name: org.name,
                  slug: org.slug
                }
              }
            }
            return session
          }
        }
      }
    },
    emailAndPassword: {
      enabled: true
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'viewer'
        },
        organizationId: {
          type: 'string',
          required: false
        },
        banned: {
          type: 'boolean',
          required: false,
          defaultValue: false
        },
        banReason: {
          type: 'string',
          required: false
        },
        banExpires: {
          type: 'date',
          required: false
        }
      }
    },
    plugins: [
      admin({
        adminRoles: ['admin', 'super_admin'],
        defaultRole: 'viewer',
        ac,
        roles: {
          super_admin: ac.newRole(adminAc.statements),
          admin: ac.newRole(adminAc.statements),
          viewer: ac.newRole(userAc.statements)
        }
      }),
      apiKey(),
      organization({
        schema: {
          organization: {
            additionalFields: {
              hostname: {
                type: 'string',
                required: false
              },
              cookieName: {
                type: 'string',
                required: false
              },
              apiUrl: {
                type: 'string',
                required: false
              },
              isLive: {
                type: 'boolean',
                defaultValue: false
              }
            }
          }
        }
      })
    ]
  }
})
