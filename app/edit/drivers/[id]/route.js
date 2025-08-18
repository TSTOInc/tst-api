import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { id } = params; // comes from /edit/drivers/[id]
    const data = await request.json();
    const {
      license_url,
      name,
      phone,
      email,
      license_number,
      image_url,
      status,
    } = data;

    if (!id) {
      return createCorsResponse({ error: "Driver ID is required" }, 400);
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let index = 1;

    if (license_url !== undefined) {
      fields.push(`license_url = $${index++}`);
      values.push(license_url);
    }
    if (name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${index++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(email);
    }
    if (license_number !== undefined) {
      fields.push(`license_number = $${index++}`);
      values.push(license_number);
    }
    if (image_url !== undefined) {
      fields.push(`image_url = $${index++}`);
      values.push(image_url);
    }
    if (status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(status);
    }

    if (fields.length === 0) {
      return createCorsResponse(
        { error: "No fields provided for update" },
        400
      );
    }

    values.push(id); // last param for WHERE

    const updateText = `
      UPDATE drivers
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING *;
    `;

    const result = await client.query(updateText, values);

    if (result.rowCount === 0) {
      return createCorsResponse({ error: "Driver not found" }, 404);
    }

    return createCorsResponse({ success: true, driver: result.rows[0] }, 200);
  } catch (error) {
    return createCorsResponse({ error: error.message }, 500);
  } finally {
    client.release();
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 200);
}
