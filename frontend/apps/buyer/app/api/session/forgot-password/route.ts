import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const base = process.env.API_BASE_URL;
  if (!base) return NextResponse.json({ error: { message: "Authentication service is unavailable." } }, { status: 503 });
  const response = await fetch(`${base.replace(/\/$/, "")}/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return new NextResponse(response.body, { status: response.status, headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" } });
}
