import type { HealthResponse } from '@paramify/shared';
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json<HealthResponse>({ ok: true });
}
