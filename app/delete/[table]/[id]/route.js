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
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');
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
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.headers.set('Access-Control-Max-Age', '86400'); // 1 day
    return res;
}