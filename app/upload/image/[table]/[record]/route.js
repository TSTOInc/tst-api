import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function POST(req, { params }) {
    const { table, record } = params
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return createCorsResponse({ error: "No file uploaded" }, 400);

    const uploaded = await put(`${table}/${record}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    return createCorsResponse({ url: uploaded.url });
  } catch (err) {
    console.error(err);
    return createCorsResponse({ error: "Upload failed" }, 500);
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 204);
}
