import 'server-only';
import { z } from 'zod';
import { LankaError } from './security';

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } });
}
export function errorResponse(error: unknown) {
  if (error instanceof LankaError) return json({ error: error.code }, error.status);
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return json({ error: 'invalid_request' }, 400);
  console.error('[lanka] Request failed', error instanceof Error ? error.message : 'unknown');
  return json({ error: 'unavailable' }, 503);
}
export async function readJson(request: Request) {
  const body = await request.text();
  if (body.length > 4096) throw new LankaError('request_too_large', 413);
  return JSON.parse(body);
}
