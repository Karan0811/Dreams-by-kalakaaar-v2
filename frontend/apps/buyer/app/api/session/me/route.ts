import { NextResponse } from "next/server";
import { getServerSession } from "@dbk/auth/server";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  return NextResponse.json({ user: { id: session.id, email: session.email, name: session.displayName, image: session.avatarUrl, emailVerified: session.emailVerified, roles: session.roles } });
}
