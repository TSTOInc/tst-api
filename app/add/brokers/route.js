import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.append("Access-Control-Allow-Origin", "*");
  res.headers.append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.append("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

// Handle POST
export async function POST(request) {
  const client = await pool.connect();
  try {
    const data = await request.json();
    const {
      image_url,
      name,
      usdot_number,
      docket_number,
      address,
      phone,
      email,
      website,
      status,
      notes,
    } = data;

    if (!name || !usdot_number || !docket_number || !address) {
      return createCorsResponse({ error: "Missing required fields" }, 400);
    }

    const insertText = `
      INSERT INTO brokers (image_url, name, usdot_number, docket_number, address, phone, email, website, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
    `;
    const resQuery = await client.query(insertText, [
      image_url || null,
      name,
      usdot_number,
      docket_number,
      address,
      phone || null,
      email || null,
      website || null,
      status,
      notes || null,
    ]);

    const brokerId = resQuery.rows[0].id;
    return createCorsResponse({ success: true, broker_id: brokerId }, 201);
  } catch (err) {
    return createCorsResponse({ error: err.message }, 500);
  } finally {
    client.release();
  }
}

// Handle OPTIONS preflight
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.append("Access-Control-Allow-Origin", "*");
  res.headers.append("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.append("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
