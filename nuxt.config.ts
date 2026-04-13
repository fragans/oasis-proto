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

  routeRules: {
    '/': { redirect: '/campaigns' }
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: Number(process.env.REDIS_PORT) || 6379,
    obsEndpoint: process.env.OBS_ENDPOINT || '',
    obsAccessKeyId: process.env.OBS_ACCESS_KEY_ID || '',
    obsSecretAccessKey: process.env.OBS_SECRET_ACCESS_KEY || '',
    obsBucket: process.env.OBS_BUCKET || '',
    obsCdnUrl: process.env.OBS_CDN_URL || ''
  },

  nitro: {
    experimental: {
      asyncContext: true
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
