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

    const {
      load_number,
      commodity,
      load_type,
      equipment_type,
      length_ft,
      rate,
      instructions,
      stops = [],
      parties = [],
      tags = [],
    } = data;

    // Basic validation (add more if you want)
    if (!load_number || !commodity || !load_type || !equipment_type || !length_ft || !rate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Insert load
    const loadInsertText = `
      INSERT INTO loads (load_number, commodity, load_type, equipment_type, length_ft, rate, instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;

    const loadRes = await client.query(loadInsertText, [
      load_number,
      commodity,
      load_type,
      equipment_type,
      length_ft,
      rate,
      instructions || null,
    ]);

    const loadId = loadRes.rows[0].id;

    // Insert stops
    for (const stop of stops) {
      const stopInsertText = `
        INSERT INTO stops (load_id, type, location, time_type, appointment_time, window_start, window_end)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
      await client.query(stopInsertText, [
        loadId,
        stop.type,
        stop.location,
        stop.time_type,
        stop.appointment_time || null,
        stop.window_start || null,
        stop.window_end || null,
      ]);
    }

    // Insert parties
    for (const party of parties) {
      const partyInsertText = `
        INSERT INTO parties (load_id, type, name, driver_order)
        VALUES ($1, $2, $3, $4);
      `;
      await client.query(partyInsertText, [
        loadId,
        party.type,
        party.name,
        party.driver_order || null,
      ]);
    }

    // Insert tags
    for (const tag of tags) {
      const tagInsertText = `
        INSERT INTO load_tags (load_id, tag)
        VALUES ($1, $2);
      `;
      await client.query(tagInsertText, [loadId, tag]);
    }

    await client.query('COMMIT');

    return NextResponse.json({ success: true, load_id: loadId }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
