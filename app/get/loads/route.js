import { NextResponse } from 'next/server'
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM loads')
    const data = result.rows
    return createCorsResponse(data)
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500)
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 204)
}
