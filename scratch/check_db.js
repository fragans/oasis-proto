import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

async function check() {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'api_tokens'`
    console.log('Table exists:', result.length > 0)
    if (result.length > 0) {
      const columns = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'api_tokens'`
      console.log('Columns:', columns.map(c => c.column_name))
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await sql.end()
  }
}

check()
