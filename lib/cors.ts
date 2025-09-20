import { NextResponse } from "next/server"

// Read allowed origins from env
// Example: "*" for dev, or "https://tst.dev.incashy.com,https://app.incashy.com" for prod
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map(o => o.trim())

function getAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return null

  // If * is allowed or origin is in the list
  if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
    return origin
  }
  return null
}

export function createCorsResponse(request: Request, data: any, status = 200) {
  const origin = getAllowedOrigin(request)
  const res = NextResponse.json(data, { status })

  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin)
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  return res
}

export function handleOptions(request: Request) {
  const origin = getAllowedOrigin(request)
  const res = new NextResponse(null, { status: 204 })

  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin)
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  return res
}
