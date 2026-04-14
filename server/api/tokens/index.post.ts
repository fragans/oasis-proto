import { randomBytes, createHash } from 'node:crypto'
import { apiTokens } from '../../database/schema'
import { z } from 'zod'

const createTokenSchema = z.object({
  name: z.string().min(1).max(255)
})

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createTokenSchema.parse(body)

  const rawToken = `oasis_${randomBytes(32).toString('hex')}`
  const prefix = rawToken.slice(0, 12)
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  const [created] = await db.insert(apiTokens).values({
    name: parsed.name,
    tokenHash,
    prefix
  }).returning()

  setResponseStatus(event, 201)
  return {
    id: created.id,
    name: created.name,
    token: rawToken,
    prefix,
    createdAt: created.createdAt
  }
})
