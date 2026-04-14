// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    ignores: [
      'server/database/migrations/relations.ts',
      'server/database/migrations/schema.ts'
    ]
  }
)
