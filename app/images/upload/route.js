import { NextRequest, NextResponse } from "next/server";
import { upload } from "@vercel/blob/server"; // server-side SDK
import formidable from "formidable";

// Disable default body parser
export const config = {
  api: { bodyParser: false },
};

function createCorsResponse(data, status = 200) {
  const res = NextResponse.json(data, { status })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}
export default async function handler(req) {
  if (req.method !== "POST") {
    return createCorsResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const form = formidable({ multiples: false });

  try {
    const data = await new Promise<{ file: formidable.File }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ file: files.file });
      });
    });

    if (!data.file) {
      return createCorsResponse({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const uploaded = await upload(data.file.originalFilename, data.file.filepath, {
      access: "public",
    });

    return createCorsResponse({ url: uploaded.url });
  } catch (err) {
    console.error(err);
    return createCorsResponse({ error: "Upload failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return createCorsResponse({}, 204)
}
