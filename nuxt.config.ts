export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
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
      // Multi-tenancy
      defaultTenantId: process.env.DEFAULT_TENANT_ID || 'no-tenant'
    }
  },

  routeRules: {
    '/': { redirect: '/campaigns' }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    experimental: {
      asyncContext: true
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
