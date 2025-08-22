import { NextResponse } from 'next/server'
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
})

function createCorsResponse(data, status = 200) {
    const res = NextResponse.json(data, { status })
    res.headers.set('Access-Control-Allow-Origin', '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return res
}

export async function GET(req) {

    if (!ALLOWED_TABLES.includes(table)) {
        return createCorsResponse({ error: 'Invalid table name' }, 400)
    }

    try {
        let data
        const result = await pool.query(queryText)
        data = result.rows[0]

        return createCorsResponse(data)
    } catch (error) {
        return createCorsResponse({ error: error.message }, 500)
    }
}

export async function OPTIONS() {
    return createCorsResponse({}, 204)
}
