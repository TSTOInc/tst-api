import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*') // or restrict to your domain
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function GET(req, { params }) {
  const { table, id } = params;

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
export async function OPTIONS() {
  // Handle CORS preflight requests
  return createCorsResponse({}, 204)
}
