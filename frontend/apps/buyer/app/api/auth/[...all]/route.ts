import { NextResponse } from "next/server";

/** Legacy frontend Better Auth endpoint deliberately retired. */
export function GET() { return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }); }
export const POST = GET;
