import { NextResponse } from 'next/server';
import pkg from 'pg';
const { Pool } = pkg;

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Database URL from environment
    ssl: { rejectUnauthorized: false },         // For secure connections (adjust if needed)
});

// Helper function to add CORS headers to the response
function createCorsResponse(data, status = 200) {
    const res = NextResponse.json(data, { status });

    // Allow all origins (or restrict to your domain)
    res.headers.set('Access-Control-Allow-Origin', '*');
    // Allow GET and OPTIONS requests
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    // Allow Content-Type header
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return res;
}

// Handle GET requests
export async function GET(req, { params }) {
    const { table, id } = params; // Get table name and ID from the route

    try {
        let data;

        const result = await pool.query(
            `DELETE FROM ${table} WHERE id = $1::uuid;`,
            [id]
        );
        data = result.rows[0] || null;

        // Return data with CORS headers
        return createCorsResponse(data);

    } catch (error) {
        // Return error message with CORS headers
        return createCorsResponse({ error: error.message }, 500);
    }
}

// Handle OPTIONS requests (CORS preflight)
export async function OPTIONS() {
    return createCorsResponse({}, 204); // No content, but CORS headers included
}
