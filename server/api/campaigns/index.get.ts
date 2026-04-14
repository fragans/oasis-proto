import { eq, ilike, and, sql, asc, desc, type AnyColumn } from 'drizzle-orm'
import { campaigns, type campaignStatusEnum } from '../../database/schema'

type CampaignStatus = (typeof campaignStatusEnum.enumValues)[number]

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const sortBy = (query.sortBy as string) || 'createdAt'
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

  const conditions = []

  if (query.status && query.status !== 'all') {
    conditions.push(eq(campaigns.status, query.status as CampaignStatus))
  }

  if (query.search) {
    conditions.push(ilike(campaigns.name, `%${query.search}%`))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const sortColumn = (campaigns[sortBy as keyof typeof campaigns] || campaigns.createdAt) as AnyColumn
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const [rows, countResult] = await Promise.all([
    db.select().from(campaigns).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(campaigns).where(where)
  ])

  return {
    campaigns: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
