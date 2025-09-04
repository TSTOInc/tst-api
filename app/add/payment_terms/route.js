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
    const { name, days_to_pay, fee_percent, is_quickpay, email, broker_id } = data;

    if (!name || !days_to_pay || is_quickpay === undefined || !broker_id) {
      return createCorsResponse({ error: 'Missing required fields' }, 400);
    }

    const insertText = `
      INSERT INTO payment_terms (name, days_to_pay, fee_percent, is_quickpay, email, broker_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    const res = await client.query(insertText, [
      name,
      days_to_pay,
      fee_percent || 0,
      is_quickpay,
      email || null,
      broker_id,
    ]);

    const payment_termsId = res.rows[0].id;
    return createCorsResponse({ success: true, payment_terms_id: payment_termsId }, 201);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
