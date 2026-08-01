import { NextResponse } from 'next/server';
import { getOpenApiJson } from '@/shared/openapi/spec';

/** Unauthenticated by design — API documentation, not a data endpoint. */
export const GET = () => NextResponse.json(getOpenApiJson());
