import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8000";

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

  const headers = new Headers();
  // Forward relevant headers
  for (const [key, value] of req.headers.entries()) {
    if (
      key === "host" ||
      key === "connection" ||
      key === "content-length" ||
      key.startsWith("x-vercel") ||
      key.startsWith("x-forwarded")
    ) {
      continue;
    }
    headers.set(key, value);
  }

  // 對有 body 的請求先 buffer 成 ArrayBuffer，避免 ReadableStream
  // 失去 content-length 導致 FastAPI multipart parser 拿不到資料
  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
    headers.set("content-length", body.byteLength.toString());
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    redirect: "follow",
  });

  const responseHeaders = new Headers();
  for (const [key, value] of response.headers.entries()) {
    if (key === "transfer-encoding" || key === "content-encoding") continue;
    responseHeaders.set(key, value);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
