import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@dbk/auth/server";
import { fetchCreatorPerformance, ApiError } from "@dbk/api-client/server";

const ALLOWED_PERIODS = new Set(["last_7_days", "last_30_days", "last_90_days", "year_to_date"]);

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session || !session.roles.includes("creator")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You don't have permission to do that.", correlationId: crypto.randomUUID() } },
      { status: 403 },
    );
  }

  const requestedPeriod = request.nextUrl.searchParams.get("period");
  const period = requestedPeriod && ALLOWED_PERIODS.has(requestedPeriod) ? requestedPeriod : "last_30_days";

  try {
    const result = await fetchCreatorPerformance(session.id, period);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, correlationId: error.correlationId } },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
      { status: 500 },
    );
  }
}
