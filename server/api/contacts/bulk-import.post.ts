import { contacts } from '../../database/schema'
import { bulkImportContactSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = bulkImportContactSchema.parse(body)

  const created = await db.insert(contacts).values(parsed.contacts).returning()

  setResponseStatus(event, 201)
  return { imported: created.length, contacts: created }
})
