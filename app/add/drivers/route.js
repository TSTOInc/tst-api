import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const data = await request.json();
    const { license_url, name, phone, email, license_number, image_url, status } = data;

    if (!name || !phone || !status) {
      return createCorsResponse({ error: 'Missing required fields' }, 400);
    }

    const insertText = `
      INSERT INTO drivers (license_url, name, phone, email, license_number, image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      license_url || null,
      name,
      phone,
      email || null,
      license_number || null,
      image_url || null,
      status,
    ]);

    const driverId = res.rows[0].id;
    return createCorsResponse({ success: true, driver_id: driverId }, 201);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
