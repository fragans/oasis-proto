import '@onmax/nuxt-better-auth'
import 'better-auth'

declare module '@onmax/nuxt-better-auth' {
  interface AuthUser {
    role: string
    organizationId?: string | null
  }
  interface AuthSession {
    activeOrganizationId?: string | null
    activeOrganization?: {
      id: string
      name: string
      slug: string
    } | null
  }
}

declare module '#nuxt-better-auth' {
  interface AuthUser {
    role: string
    organizationId?: string | null
  }
  interface AuthSession {
    activeOrganizationId?: string | null
    activeOrganization?: {
      id: string
      name: string
      slug: string
    } | null
  }
}

declare module 'better-auth' {
  interface User {
    role: string
    organizationId?: string | null
  }
  interface Session {
    activeOrganizationId?: string | null
    activeOrganization?: {
      id: string
      name: string
      slug: string
    } | null
  }
}

declare module 'better-auth/plugins/admin' {
  interface UserWithRole {
    role: string
    organizationId?: string | null
  }
}

export {}
