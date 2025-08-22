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
    // Query loads and their stops
    const result = await pool.query(`
      SELECT 
        l.*,
        s.id AS stop_id,
        s.address AS stop_address,
        s.sequence AS stop_sequence
      FROM loads l
      LEFT JOIN stops s ON s.load_id = l.id
      ORDER BY l.id, s.sequence
    `)

    // Group stops by load
    const loadsMap = new Map()

    result.rows.forEach(row => {
      const loadId = row.id
      if (!loadsMap.has(loadId)) {
        loadsMap.set(loadId, { 
          ...row, 
          stops: [] 
        })
      }
      if (row.stop_id) {
        loadsMap.get(loadId).stops.push({
          id: row.stop_id,
          address: row.stop_address,
          sequence: row.stop_sequence
        })
      }

      // Remove stop columns from load object
      delete loadsMap.get(loadId).stop_id
      delete loadsMap.get(loadId).stop_address
      delete loadsMap.get(loadId).stop_sequence
    })

    const data = Array.from(loadsMap.values())
    return createCorsResponse(data)
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500)
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 204)
}
