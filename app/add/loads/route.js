import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const VALID_LOAD_STATUSES = ['new', 'in_transit', 'delivered', 'invoiced', 'paid'];
const VALID_LOAD_TYPES = ['FTL', 'LTL'];
const VALID_EQUIPMENT_TYPES = ['reefer', 'van', 'flatbed'];
const VALID_STOP_TYPES = ['pickup', 'delivery'];
const VALID_TIME_TYPES = ['appointment', 'window'];

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const data = await request.json();

    let {
      load_number,
      invoice_number = null,
      load_status = 'new',
      commodity,
      load_type,
      length_ft,
      rate,
      payment_terms_id,
      truck_id,
      equipment_id,
      broker_id,
      instructions = null,
      stops = [],
      tags = [],
    } = data;

    // Validation
    if (
      !load_number ||
      !commodity ||
      !load_type ||
      !length_ft ||
      !rate ||
      !payment_terms_id ||
      !broker_id
    ) {
      return withCors(
        NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      );
    }

    if (!VALID_LOAD_STATUSES.includes(load_status)) {
      return withCors(
        NextResponse.json({ error: `Invalid load_status. Must be one of ${VALID_LOAD_STATUSES.join(', ')}` }, { status: 400 })
      );
    }

    if (!VALID_LOAD_TYPES.includes(load_type)) {
      return withCors(
        NextResponse.json({ error: `Invalid load_type. Must be one of ${VALID_LOAD_TYPES.join(', ')}` }, { status: 400 })
      );
    }

    await client.query('BEGIN');

    // Auto-generate invoice_number if not provided
    if (!invoice_number) {
      const seqRes = await client.query(`SELECT nextval('invoice_number_seq') AS next_invoice`);
      invoice_number = seqRes.rows[0].next_invoice.toString();
    }

    // Insert load
    const loadInsertText = `
      INSERT INTO loads
        (load_number, invoice_number, load_status, commodity, load_type, length_ft, rate, payment_terms_id, truck_id, equipment_id, broker_id, instructions)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id;
    `;

    const loadRes = await client.query(loadInsertText, [
      load_number,
      invoice_number,
      load_status,
      commodity,
      load_type,
      length_ft,
      rate,
      payment_terms_id,
      truck_id,
      equipment_id,
      broker_id,
      instructions,
    ]);

    const loadId = loadRes.rows[0].id;

    // Insert stops
    for (const stop of stops) {
      if (
        !stop.type ||
        !VALID_STOP_TYPES.includes(stop.type) ||
        !stop.location ||
        !stop.time_type ||
        !VALID_TIME_TYPES.includes(stop.time_type)
      ) {
        await client.query('ROLLBACK');
        return withCors(
          NextResponse.json({ error: 'Invalid stop data: type, location, and time_type are required and must be valid' }, { status: 400 })
        );
      }

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

    // Insert tags
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.length === 0) continue;

      const tagInsertText = `
        INSERT INTO load_tags (load_id, tag)
        VALUES ($1, $2);
      `;
      await client.query(tagInsertText, [loadId, tag]);
    }

    await client.query('COMMIT');

    return withCors(
      NextResponse.json({ success: true, load_id: loadId, invoice_number }, { status: 201 })
    );
  } catch (error) {
    await client.query('ROLLBACK');
    return withCors(
      NextResponse.json({ error: error.message }, { status: 500 })
    );
  } finally {
    client.release();
  }
}
