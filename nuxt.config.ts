export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@onmax/nuxt-better-auth',
    'nuxt-skill-hub'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    // Cloudflare KV — used by the kv-sync utility to push live campaigns to oasis-edge
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    cloudflareKvNamespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID || '',
    // S3 Storage (AWS/OBS)
    s3Endpoint: process.env.S3_ENDPOINT || '',
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || 'ap-southeast-3',
    s3CdnUrl: process.env.S3_CDN_URL || '',

    public: {
    }
  },

  routeRules: {
    '/login': { auth: 'guest' },
    '/no-organization': { auth: 'user' },
    '/initiate-organization': { auth: 'user' },
    '/organizations/select': { auth: 'user' },
    // All organization-context routes are protected
    '/[org]/**': { auth: 'user' },
    '/workflow': { auth: 'user' }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    experimental: {
      asyncContext: true
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@better-auth/api-key',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'better-auth/client/plugins',
        'zod'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
