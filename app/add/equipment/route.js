import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper to add CORS headers
function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

// Handle OPTIONS preflight request for CORS
export async function OPTIONS() {
  return createCorsResponse({}, 200);
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const data = await request.json();
    const { image_url, equipment_number, equipment_type, status } = data;

    // Validation
    if (!equipment_number || !equipment_type || !status) {
      return createCorsResponse({ error: 'Missing required fields' }, 400);
    }

    const insertText = `
      INSERT INTO equipment (image_url, equipment_number, equipment_type, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      image_url || null,
      equipment_number,
      equipment_type,
      status,
    ]);

    const equipmentId = res.rows[0].id;
    return createCorsResponse({ success: true, equipment_id: equipmentId }, 201);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}
