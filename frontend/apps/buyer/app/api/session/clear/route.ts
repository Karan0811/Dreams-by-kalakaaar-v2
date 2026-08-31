import { NextResponse } from "next/server";
import { logoutBackendSession } from "@dbk/auth/server";

/** Revokes the sole canonical backend session. */
export async function POST() {
  await logoutBackendSession();
  return new NextResponse(null, { status: 204 });
}
