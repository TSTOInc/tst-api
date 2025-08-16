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
    const { image_url, truck_number, truck_alias, vin, make, model, year, transponder_id,  driver_id, status, color } = data;

    if (!truck_number || !status) {
        const missingFields = [];
        if (!truck_number) missingFields.push('truck_number');
        if (!status) missingFields.push('status');
      return createCorsResponse({ error: 'Missing required fields: ' + missingFields.join(', ') + '.' }, 400);
    }

    const insertText = `
      INSERT INTO trucks (image_url, truck_number, truck_alias, vin, make, model, year, transponder_id, driver_id, status, color)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      image_url || null,
      truck_number,
      truck_alias || null,
      vin || null,
      make || null,
      model || null,
      year || null,
      transponder_id || null,
      driver_id || null,
      status,
      color || null,
    ]);

    const truckId = res.rows[0].id;
    return createCorsResponse({ success: true, truck_id: truckId }, 201);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
