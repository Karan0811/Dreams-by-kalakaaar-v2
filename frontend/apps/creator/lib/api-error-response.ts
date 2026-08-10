import { NextResponse } from "next/server";
import { ApiError } from "@dbk/api-client/server";

/**
 * Maps a thrown error from an `@dbk/api-client/server` call to the same
 * `{error:{code,message,details,correlationId}}` envelope every existing
 * BFF route (Products, Dashboard) already hand-rolls in its `catch` block.
 * Extracted here so Sprint 02's new routes (Creator profile sub-resources,
 * Variants, Categories) don't repeat it an 11th, 12th, 13th... time.
 */
export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details, correlationId: error.correlationId } },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { error: { code: "SERVER_ERROR", message: "Something went wrong.", correlationId: crypto.randomUUID() } },
    { status: 500 },
  );
}
