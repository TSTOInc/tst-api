import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });

  // Allow all origins (or restrict to your domain)
  res.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  // Allow GET and OPTIONS requests
  res.headers.set('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  // Allow Content-Type header
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return res;
}


export async function DELETE(req, { params }) {
    const { table, id } = params;
    
    try {
        const result = await pool.query(
            `DELETE FROM ${table} WHERE id = $1::uuid RETURNING *;`,
            [id]
        );

        if (result.rowCount === 0) {
            return createCorsResponse({ message: 'No row found' }, 404);
        }

        return createCorsResponse({
            message: 'Record deleted',
            deleted: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        return createCorsResponse({ error: error.message }, 500);
    }
}

// OPTIONS handler for preflight
export async function OPTIONS() {
    return createCorsResponse({}, 204);
}
