import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Database URL from environment
  ssl: { rejectUnauthorized: false },         // For secure connections (adjust if needed)
});

// Helper function to add CORS headers to the response
function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });

  // Allow all origins (or restrict to your domain)
  res.headers.set('Access-Control-Allow-Origin', '*');
  // Allow GET and OPTIONS requests
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Allow Content-Type header
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return res;
}

// Handle GET requests
export async function GET(req, { params }) {
  const { table, id } = params; // Get table name and ID from the route

  try {
    let data;

    switch (table) {

      // ===== BROKERS =====
      case 'brokers': {
        // Fetch broker by ID
        const brokerResult = await pool.query(
          `SELECT * FROM brokers WHERE id = $1::uuid;`,
          [id]
        );
        const broker = brokerResult.rows[0] || null;

        if (broker) {
          // Fetch all agents associated with this broker
          const agentsResult = await pool.query(
            `SELECT * FROM brokers_agents WHERE broker_id = $1::uuid;`,
            [id]
          );
          broker.broker_agents = agentsResult.rows;

          // Fetch all loads associated with this broker
          const brokerLoadsResult = await pool.query(
            `SELECT * FROM loads WHERE broker_id = $1::uuid;`,
            [id]
          );
          broker.loads = brokerLoadsResult.rows;

          // Fetch all payment terms associated with this broker
          const brokerPaymentTermsResult = await pool.query(
            `SELECT * FROM payment_terms WHERE broker_id = $1::uuid;`,
            [id]
          );
          broker.payment_terms = brokerPaymentTermsResult.rows;
        }

        data = broker;
        break;
      }

      // ===== BROKER AGENTS =====
      case 'brokers_agents': {
        // Fetch broker agent by ID
        const result = await pool.query(
          `SELECT * FROM brokers_agents WHERE id = $1::uuid;`,
          [id]
        );
        const brokerAgent = result.rows[0] || null;

        if (brokerAgent) {
          // Fetch the broker name for this agent
          const brokerResult = await pool.query(
            `SELECT "name" FROM brokers WHERE id = $1::uuid;`,
            [brokerAgent.broker_id]
          );
          brokerAgent.broker = brokerResult.rows;
        }

        data = brokerAgent;
        break;
      }

      // ===== TRUCKS =====
      case 'trucks': {
        // Fetch truck by ID
        const truckResult = await pool.query(
          `SELECT * FROM trucks WHERE id = $1::uuid;`,
          [id]
        );
        const truck = truckResult.rows[0] ?? null;

        if (truck) {
          // Fetch associated loads
          const loadsResult = await pool.query(
            `SELECT * FROM loads WHERE truck_id = $1::uuid;`,
            [id]
          );
          truck.loads = loadsResult.rows;

          // Fetch associated truck inspections
          const inspectionsResult = await pool.query(
            `SELECT * FROM truck_inspections WHERE truck_id = $1::uuid;`,
            [id]
          );
          truck.inspections = inspectionsResult.rows;

          // Fetch associated truck plates
          const platesResult = await pool.query(
            `SELECT * FROM truck_plates WHERE truck_id = $1::uuid;`,
            [id]
          );
          truck.plates = platesResult.rows;

          // Fetch associated truck repairs
          const repairsResult = await pool.query(
            `SELECT * FROM truck_repairs WHERE truck_id = $1::uuid;`,
            [id]
          );
          truck.repairs = repairsResult.rows;
        }

        data = truck;
        break;
      }

      // ===== DEFAULT CASE =====
      default: {
        // Fetch a single record from any other table by ID
        const result = await pool.query(
          `SELECT * FROM ${table} WHERE id = $1::uuid;`,
          [id]
        );
        data = result.rows[0] || null;
        break;
      }
    }

    // Return data with CORS headers
    return createCorsResponse(data);

  } catch (error) {
    // Return error message with CORS headers
    return createCorsResponse({ error: error.message }, 500);
  }
}

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS() {
  return createCorsResponse({}, 204); // No content, but CORS headers included
}
