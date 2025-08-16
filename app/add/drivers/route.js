import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const data = await request.json();

    const { license_url, name, phone, email, license_number, image_url } = data;

    // Validation
    if (!name || !phone) {
      return createCorsResponse({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertText = `
      INSERT INTO drivers (license_url, name, phone, email, license_number, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      license_url || null,
      name,
      phone,
      email || null,
      license_number,
    ]);

    const driverId = res.rows[0].id;

    return createCorsResponse({ success: true, driver_id: driverId }, { status: 201 });
  } catch (error) {
    return createCorsResponse({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// Handle OPTIONS preflight request for CORS
export async function OPTIONS() {
  return createCorsResponse({}, 200);
}