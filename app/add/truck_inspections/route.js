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
    const { truck_id, inspection_date, inspection_type, result, notes } = data;

    if (!truck_id || !inspection_date || !inspection_type || !result) {
        const missingFields = [];
        if (!truck_id) missingFields.push('truck_number');
        if (!inspection_date) missingFields.push('inspection_date');
        if (!inspection_type) missingFields.push('inspection_type');
        if (!result) missingFields.push('result');
      return createCorsResponse({ error: 'Missing required fields: ' + missingFields.join(', ') + '.' }, 400);
    }

    const insertText = `
      INSERT INTO truck_inspections (truck_id, inspection_date, inspection_type, result, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      truck_id,
      inspection_date,
      inspection_type,
      result,
      notes || null,
    ]);

    const truckInspectionId = res.rows[0].id;
    return createCorsResponse({ success: true, truck_inspection_id: truckInspectionId }, 201);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
