import { NextResponse } from "next/server";
import { clearBackendSession } from "@dbk/auth/server";

/** Called alongside Better Auth's own `signOut()` so the backend-bridge cookies don't outlive the local session. */
export async function POST() {
  await clearBackendSession();
  return new NextResponse(null, { status: 204 });
}
