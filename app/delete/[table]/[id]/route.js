import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
    const res = NextResponse.json(data, { status });

    // Allow any origin (you can replace '*' with your domain for security)
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
    );
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Max-Age', '86400'); // cache preflight 24h

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
