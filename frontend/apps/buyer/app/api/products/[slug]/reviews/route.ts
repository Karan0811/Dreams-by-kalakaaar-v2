import { NextRequest, NextResponse } from "next/server";
import { fetchProductReviews, createReview } from "@dbk/api-client/server";
import { requireAccessToken } from "@/lib/api-auth";
import { apiErrorResponse } from "@/lib/api-error-response";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  try {
    const result = await fetchProductReviews(slug, {
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAccessToken();
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body.", correlationId: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  try {
    const result = await createReview(auth.accessToken, slug, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
