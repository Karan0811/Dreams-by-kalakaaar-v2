import { NextResponse } from 'next/server';
import { getOpenApiYamlText } from '@/shared/openapi/spec';

/** Unauthenticated by design — API documentation, not a data endpoint. */
export const GET = () =>
  new NextResponse(getOpenApiYamlText(), {
    status: 200,
    headers: { 'Content-Type': 'application/yaml; charset=utf-8' },
  });
