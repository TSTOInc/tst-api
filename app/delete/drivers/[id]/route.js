import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;
import { del } from '@vercel/blob';


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
    const { id } = params;
    try {

        // fetch record to get image url
        const { rows } = await pool.query(
            `SELECT image_url, license_url FROM drivers WHERE id = $1::uuid;`,
            [id]
        );
        if (rows.length === 0) {
            return createCorsResponse({ message: 'No row found' }, 404);
        }
        const { image_url, license_url } = rows[0];

        // delete image_url blob
        if (image_url) {
            try {
                await del(image_url);
            } catch (err) {
                console.warn("Image blob not found or already deleted:", image_url);
            }
        }
        if (license_url) {
            try {
                await del(license_url);
            } catch (err) {
                console.warn("Image blob not found or already deleted:", image_url);
            }
        }
        const result = await pool.query(
            `DELETE FROM drivers WHERE id = $1::uuid RETURNING *;`,
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