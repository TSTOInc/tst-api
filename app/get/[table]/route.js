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
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function GET(req, { params }) {
  const { table, id } = params

  if (!ALLOWED_TABLES.includes(table)) {
    return createCorsResponse({ error: 'Invalid table name' }, 400)
  }

  try {
    let data

    switch (table) {
      case 'brokers_agents': {
        // Get the agent
        const result = await pool.query(
          `SELECT * FROM brokers_agents`
        )
        const brokerAgent = result.rows[0] || null

        // If found, attach broker name
        if (brokerAgent) {
          const brokerResult = await pool.query(
            `SELECT name FROM brokers WHERE id = $1::uuid;`,
            [brokerAgent.broker_id]
          )
          brokerAgent.broker = brokerResult.rows[0] || null
        }

        data = brokerAgent
        break
      }

      default: {
        const queryText = id
          ? `SELECT * FROM ${table} WHERE id = $1::uuid;`
          : `SELECT * FROM ${table};`
        const values = id ? [id] : []
        const result = await pool.query(queryText, values)
        data = id ? result.rows[0] || null : result.rows
        break
      }
    }

    return createCorsResponse(data)
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500)
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 204)
}
