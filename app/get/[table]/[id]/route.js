import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Allowed tables to prevent SQL injection
const ALLOWED_TABLES = [
  'broker_payment_terms',
  'brokers',
  'brokers_agents',
  'drivers',
  'equipment',
  'load_drivers',
  'load_tags',
  'loads',
  'payment_terms',
  'stops',
  'truck_inspections',
  'truck_plates',
  'truck_repairs',
  'trucks'
];

function createCorsResponse(data, status = 200) {
  const res = createCorsResponse(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*') // or restrict to your domain
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function GET(req, { params }) {
  const { table, id } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return createCorsResponse({ error: 'Invalid table name' }, { status: 400 });
  }

  try {
  const result = await pool.query(
    `SELECT * FROM ${table} WHERE id = $1::uuid;`,
    [id]
  );
    return createCorsResponse(result.rows);
  } catch (error) {
    return createCorsResponse({ error: error.message }, { status: 500 });
  }
}
