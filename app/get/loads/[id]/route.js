import { createCorsResponse, handleOptions } from "@/lib/cors"
import pkg from "pg"
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export async function GET(req, { params }) {
  const { id } = params

  if (!id) return createCorsResponse(req, { error: "Missing load ID" }, 400)

  try {
    const result = await pool.query(
      `
      SELECT 
        l.*,
        row_to_json(b) AS broker,
        row_to_json(ba) AS agent,
        row_to_json(pt) AS payment_terms,
        row_to_json(t) AS truck,
        row_to_json(e) AS equipment,
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
      LEFT JOIN trucks t ON t.id = l.truck_id
      LEFT JOIN equipment e ON e.id = l.equipment_id
      LEFT JOIN stops s ON s.load_id = l.id
      WHERE l.id = $1
      ORDER BY s.appointment_time, s.window_start
      `,
      [id]
    )

    if (!result.rows.length)
      return createCorsResponse(req, { error: "Load not found" }, 404)

    const row = result.rows[0]
    const load = {
      id: row.id,
      load_number: row.load_number,
      invoice_number: row.invoice_number,
      load_status: row.load_status,
      commodity: row.commodity,
      load_type: row.load_type,
      length_ft: row.length_ft,
      rate: row.rate,
      instructions: row.instructions,
      created_at: row.created_at,
      updated_at: row.updated_at,
      invoiced_at: row.invoiced_at,
      paid_at: row.paid_at,
      progress: row.progress,

      agent: row.agent
        ? { id: row.agent.id, name: row.agent.name }
        : { id: null, name: null },

      truck: row.truck
        ? { id: row.truck.id, truck_number: row.truck.truck_number }
        : null,

      equipment: row.equipment
        ? { id: row.equipment.id, equipment_number: row.equipment.equipment_number }
        : null,

      broker: row.broker
        ? {
            id: row.broker.id,
            name: row.broker.name,
            address_1: row.broker.address,
            address_2: row.broker.address_2,
          }
        : null,

      payment_terms: row.payment_terms || null,

      stops: [],
      docs: row.docs || [],
    }

    result.rows.forEach(r => {
      if (r.stop_id) {
        load.stops.push({
          id: r.stop_id,
          load_id: r.stop_load_id,
          type: r.stop_type,
          location: r.stop_location,
          time_type: r.stop_time_type,
          appointment_time: r.stop_appointment_time,
          window_start: r.stop_window_start,
          window_end: r.stop_window_end,
          created_at: r.stop_created_at,
          updated_at: r.stop_updated_at,
        })
      }
    })

    return createCorsResponse(req, load)
  } catch (error) {
    return createCorsResponse(req, { error: error.message }, 500)
  }
}

export async function OPTIONS(req) {
  return handleOptions(req)
}
