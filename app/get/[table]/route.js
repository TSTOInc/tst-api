import { NextResponse } from 'next/server'
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const ALLOWED_TABLES = [
  'broker_payment_terms',
  'brokers',
  'brokers_agents',
  'drivers',
  'equipment',
  'load_drivers',
  'load_tags',
  'loads',
  'payment_terms',
  'stops',
  'truck_inspections',
  'truck_plates',
  'truck_repairs',
  'trucks',
]

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*') // or restrict to your domain
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function GET(req, { params }) {
  const { table } = params

  if (!ALLOWED_TABLES.includes(table)) {
    return createCorsResponse({ error: 'Invalid table name' }, 400)
  }

  try {
    const queryText = `SELECT * FROM ${table};`
    const result = await pool.query(queryText)
    return createCorsResponse(result.rows)
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500)
  }
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return createCorsResponse({}, 204)
}
