import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(request) {
  const client = await pool.connect();

  try {
    const data = await request.json();

    const { image_url, name, usdot_number, docket_number, address, phone, email, website} = data;

    // Validation
    if (!name || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertText = `
      INSERT INTO brokers (image_url, name, usdot_number, docket_number, address, phone, email, website)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      website || null
    ]);

    const driverId = res.rows[0].id;

    return NextResponse.json({ success: true, driver_id: driverId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}