import { defineClientAuth } from '@onmax/nuxt-better-auth/config'
import { adminClient, organizationClient } from 'better-auth/client/plugins'
import { apiKeyClient } from '@better-auth/api-key/client'
import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements, adminAc, userAc } from 'better-auth/plugins/admin/access'

const ac = createAccessControl(defaultStatements)

export default defineClientAuth({
  plugins: [
    adminClient({
      ac,
      roles: {
        super_admin: ac.newRole(adminAc.statements),
        admin: ac.newRole(adminAc.statements),
        viewer: ac.newRole(userAc.statements)
      }
    }),
    organizationClient(),
    apiKeyClient()
  ]
})
