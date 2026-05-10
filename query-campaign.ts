import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './server/database/schema'
import { eq } from 'drizzle-orm'

const connectionString = 'postgresql://oasis_app:P4lm_Tr33@172.18.64.143:5432/oasis_v2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function main() {
  const campaign = await db.query.campaigns.findFirst({
    where: eq(schema.campaigns.id, 'daf7fb56-1b28-4a81-8389-fa3f98f17c94')
  })
  console.log(JSON.stringify(campaign, null, 2))
  process.exit(0)
}

main().catch(console.error)
