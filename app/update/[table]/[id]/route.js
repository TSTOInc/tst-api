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
  res.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function PATCH(req, { params }) {
  const { table, id } = params;

  try {
    // Parse JSON body
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
      return createCorsResponse({ error: 'No data provided for update' }, 400);
    }

    // Construct dynamic SET clause for SQL with all fields from body
    const setClauses = [];
    const values = [];
    let idx = 1;
    for (const [key, value] of Object.entries(body)) {
      setClauses.push(`"${key}" = $${idx}`);
      values.push(value);
      idx++;
    }
    // Add id as last param
    values.push(id);

    // WARNING: Be sure 'table' comes from a trusted source or sanitize it, because this is raw interpolation
    const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return createCorsResponse({ error: 'Record not found' }, 404);
    }

    return createCorsResponse(result.rows[0]);

  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 204);
}
