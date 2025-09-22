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
    const body = await req.json();
    const { document_url } = body;

    if (!document_url) {
      return createCorsResponse({ error: "document_url is required" }, 400);
    }

    // Delete from Vercel Blob
    try {
      await del(document_url);
    } catch (err) {
      console.warn("Blob not found or already deleted:", document_url);
      // Not returning here, continue to remove from DB
    }

    // Remove the document_url from the docs TEXT[] column
    const query = `
      UPDATE loads
      SET docs = array_remove(docs, $1)
      WHERE id = $2
      RETURNING docs
    `;
    const { rows } = await pool.query(query, [document_url, id]);

    if (rows.length === 0) {
      return createCorsResponse({ warning: "No record found to update" }, 404);
    }

    return createCorsResponse({
      message: "Document deleted successfully",
      deleted_url: document_url,
      updated_docs: rows[0].docs,
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
