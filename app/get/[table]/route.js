import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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

export async function GET(req, { params }) {
  const { table } = params;

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
  }

  try {
    // Use parameterized queries when possible - but here table names can't be parameterized
    // So whitelist is the best defense

    const queryText = `SELECT * FROM ${table};`;
    const result = await pool.query(queryText);

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
