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
        // Query loads, stops, and payment terms
        const result = await pool.query(`
  SELECT 
    l.*,
    b.name AS broker_name,
    ba.name AS agent_name,
    pt.days_to_pay AS payment_days_to_pay,
    s.id AS stop_id,
    s.load_id AS stop_load_id,
    s.type AS stop_type,
    s.location AS stop_location,
    s.time_type AS stop_time_type,
    s.appointment_time AS stop_appointment_time,
    s.window_start AS stop_window_start,
    s.window_end AS stop_window_end,
    s.created_at AS stop_created_at,
    s.updated_at AS stop_updated_at
  FROM loads l
  LEFT JOIN brokers b ON b.id = l.broker_id
  LEFT JOIN brokers_agents ba ON ba.id = l.agent_id
  LEFT JOIN payment_terms pt ON pt.id = l.payment_terms_id
  LEFT JOIN stops s ON s.load_id = l.id
  ORDER BY l.id, s.appointment_time, s.window_start
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
                    load_id: row.stop_load_id,
                    type: row.stop_type,
                    location: row.stop_location,
                    time_type: row.stop_time_type,
                    appointment_time: row.stop_appointment_time,
                    window_start: row.stop_window_start,
                    window_end: row.stop_window_end,
                    created_at: row.stop_created_at,
                    updated_at: row.stop_updated_at,
                })
            }

            // Remove temporary stop columns from load
            delete loadsMap.get(loadId).stop_id
            delete loadsMap.get(loadId).stop_load_id
            delete loadsMap.get(loadId).stop_type
            delete loadsMap.get(loadId).stop_location
            delete loadsMap.get(loadId).stop_time_type
            delete loadsMap.get(loadId).stop_appointment_time
            delete loadsMap.get(loadId).stop_window_start
            delete loadsMap.get(loadId).stop_window_end
            delete loadsMap.get(loadId).stop_created_at
            delete loadsMap.get(loadId).stop_updated_at
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
