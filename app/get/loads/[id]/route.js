import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
    const res = NextResponse.json(data, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
}

// GET a single load by ID
export async function GET(req, { params }) {
  const { id } = params; // Get table name and ID from the route

    if (!id) return createCorsResponse({ error: "Missing load ID" }, 400);

    try {
        const result = await pool.query(
            `
      SELECT 
        l.*,
        b.name AS broker_name,
        b.address AS broker_address_1,
        b.address_2 AS broker_address_2,
        ba.name AS agent_name,
        s.id AS stop_id,
        s.load_id AS stop_load_id,
        s.type AS stop_type,
        s.location AS stop_location,
        s.time_type AS stop_time_type,
        s.appointment_time AS stop_appointment_time,
        s.window_start AS stop_window_start,
        s.window_end AS stop_window_end
      FROM loads l
      LEFT JOIN brokers b ON b.id = l.broker_id
      LEFT JOIN brokers_agents ba ON ba.id = l.agent_id
      LEFT JOIN stops s ON s.load_id = l.id
      WHERE l.id = $1
      ORDER BY s.appointment_time, s.window_start
    `,
            [id]
        );

        if (!result.rows.length)
            return createCorsResponse({ error: "Load not found" }, 404);

        // Group stops by load
        const load = { ...result.rows[0], stops: [] };

        result.rows.forEach((row) => {
            if (row.stop_id) {
                load.stops.push({
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
                });
            }

            // Remove stop columns from load object
            delete load.stop_id;
            delete load.stop_load_id;
            delete load.stop_type;
            delete load.stop_location;
            delete load.stop_time_type;
            delete load.stop_appointment_time;
            delete load.stop_window_start;
            delete load.stop_window_end;
            delete load.stop_created_at;
            delete load.stop_updated_at;
        });

        return createCorsResponse(load);
    } catch (error) {
        return createCorsResponse({ error: error.message }, 500);
    }
}

export async function OPTIONS() {
    return createCorsResponse({}, 204);
}
