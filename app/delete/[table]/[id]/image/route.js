import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { document_url } = body;

    if (!document_url) {
      return createCorsResponse({ error: "document_url is required" }, 400);
    }

    try {
      await del(document_url);
    } catch (err) {
      console.warn("Blob not found or already deleted:", document_url);
      return createCorsResponse({ warning: "Blob not found or already deleted" });
    }

    return createCorsResponse({
      message: "Document deleted successfully",
      deleted_url: document_url,
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
