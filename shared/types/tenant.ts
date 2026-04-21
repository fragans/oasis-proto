import { z } from 'zod'

export const createTenantSchema = z.object({
  id: z.string().min(2, 'ID must be at least 2 characters').max(50),
  hostname: z.string().min(3, 'Hostname must be at least 3 characters'),
  apiUrl: z.string().url('Must be a valid URL (e.g. https://origin.com)'),
  cookieName: z.string().default('oasis_guid'),
  authCookieNames: z.array(z.string()).default([])
})

export type CreateTenant = z.infer<typeof createTenantSchema>

export interface Tenant extends CreateTenant {
  isLive: boolean
  createdAt: string
  updatedAt: string
}
