import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

// Headers that must NOT be forwarded to the browser — the proxy decompresses the
// body automatically, so re-sending the encoding header causes ERR_CONTENT_DECODING_FAILED.
const STRIP_RES_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

async function proxy(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const target = `${BACKEND}${path}${search}`;

  const reqHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (!["host", "connection", "transfer-encoding"].includes(key.toLowerCase())) {
      reqHeaders.set(key, value);
    }
  });

  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.arrayBuffer();

  const upstream = await fetch(target, {
    method: req.method,
    headers: reqHeaders,
    body,
    redirect: "manual",
  });

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RES_HEADERS.has(key.toLowerCase())) {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
