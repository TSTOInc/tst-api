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

    const { image_url, equipment_number, equipment_type, status } = data;

    // Validation
    if (!equipment_number || !equipment_type || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json({ success: true, equipment_id: equipmentId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}