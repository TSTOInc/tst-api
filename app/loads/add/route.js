import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(request) {
  try {
    const data = await request.json();

    const {
      load_number,
      commodity,
      load_type,
      equipment_type,
      length_ft,
      rate,
      instructions
    } = data;

    // Basic validation (you can expand this!)
    if (!load_number || !commodity || !load_type || !equipment_type || !length_ft || !rate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const insertLoadText = `
      INSERT INTO loads (load_number, commodity, load_type, equipment_type, length_ft, rate, instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [load_number, commodity, load_type, equipment_type, length_ft, rate, instructions || null];

    const res = await pool.query(insertLoadText, values);
    const createdLoad = res.rows[0];

    return NextResponse.json({ success: true, load: createdLoad }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
