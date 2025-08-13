import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Access-Control-Allow-Origin', '*'); // Or restrict to your domain
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function GET(req, { params }) {
  const { table, id } = params;

  try {
    let data;

    switch (table) {
      case 'brokers': {
        const brokerResult = await pool.query(
          `SELECT * FROM brokers WHERE id = $1::uuid;`,
          [id]
        );

        const broker = brokerResult.rows[0] || null;

        if (broker) {
          const agentsResult = await pool.query(
            `SELECT * FROM brokers_agents WHERE broker_id = $1::uuid;`,
            [id]
          );

          broker.broker_agents = agentsResult.rows;
        }

        data = broker;
        break;
      }

      default: {
        const result = await pool.query(
          `SELECT * FROM ${table} WHERE id = $1::uuid;`,
          [id]
        );
        data = result.rows[0] || null;
        break;
      }
    }

    return createCorsResponse(data);

  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  }
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return createCorsResponse({}, 204);
}
