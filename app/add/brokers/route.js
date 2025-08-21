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

    const { image_url, name, usdot_number, docket_number, address, phone, email, website, status, notes} = data;

    // Validation
    if (!name || !usdot_number || !docket_number || !address) {
      return createCorsResponse({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertText = `
      INSERT INTO brokers (image_url, name, usdot_number, docket_number, address, phone, email, website, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      image_url || null,
      name,
      usdot_number || null,
      docket_number || null,
      address,
      phone || null,
      email || null,
      website || null,
      status,
      notes || null
    ]);

    const driverId = res.rows[0].id;

    return createCorsResponse({ success: true, driver_id: driverId }, { status: 201 });
  } catch (error) {
    return createCorsResponse({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
