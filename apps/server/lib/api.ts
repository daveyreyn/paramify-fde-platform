import type { ErrorResponse } from '@paramify/shared';
import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function apiError(status: number, error: string): NextResponse {
  return NextResponse.json({ error } satisfies ErrorResponse, { status });
}

// Wrap a route body so domain helpers can throw HttpError for 4xx responses.
export async function handleApi(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.message);
    throw error;
  }
}

export async function parseJsonBody<T>(
  request: Request,
  schema: { parse: (value: unknown) => T },
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
  try {
    return schema.parse(body);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : 'invalid request body');
  }
}
