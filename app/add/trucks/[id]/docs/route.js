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

export async function POST(request, { params }) {
  const { id } = params;
  const client = await pool.connect();

  try {
    const data = await request.json();
    const { document_url} = data;

    if (!document_url) {
      return createCorsResponse({ error: 'Missing required field: document_url' }, 400);
    }

    const res = await client.query(`
      UPDATE trucks
      SET docs = ARRAY_APPEND(docs, '${document_url}')
      WHERE id = $1::uuid
      RETURNING id, docs;
      `, 
      [id]);

    return createCorsResponse({ success: true, truck_id: res.rows[0] }, 201);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
