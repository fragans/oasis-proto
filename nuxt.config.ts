// https://nuxt.com/docs/api/configuration/nuxt-config
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
    // Huawei OBS
    obsEndpoint: process.env.OBS_ENDPOINT || '',
    obsAccessKeyId: process.env.OBS_ACCESS_KEY_ID || '',
    obsSecretAccessKey: process.env.OBS_SECRET_ACCESS_KEY || '',
    obsBucket: process.env.OBS_BUCKET || '',
    obsCdnUrl: process.env.OBS_CDN_URL || ''
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
