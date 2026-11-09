import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import { SessionSchema, type LankaSession } from '@/features/lanka/contracts';

const runtime = globalThis as typeof globalThis & { lankaSigningKey?: string };
const runtimeKey = (runtime.lankaSigningKey ??= randomBytes(32).toString('hex'));
export class LankaError extends Error {
  constructor(
    public code: string,
    public status: number = 400
  ) {
    super(code);
  }
}
export function assertDemoEnabled() {
  if (
    env.LANKA_DEMO_ENABLED !== 'true' &&
    process.env.NODE_ENV !== 'development' &&
    process.env.NODE_ENV !== 'test'
  ) {
    throw new LankaError('demo_disabled', 404);
  }
}
export function signPayload(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', runtimeKey).update(body).digest('base64url');
  return `${body}.${signature}`;
}
export function readPayload(token: string): unknown {
  const [body, signature, extra] = token.split('.');
  if (!body || !signature || extra) throw new LankaError('unauthorized', 401);
  const expected = createHmac('sha256', runtimeKey).update(body).digest();
  const given = Buffer.from(signature, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(expected, given))
    throw new LankaError('unauthorized', 401);
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    throw new LankaError('unauthorized', 401);
  }
}
export function parseSession(token?: string): LankaSession {
  assertDemoEnabled();
  if (!token) throw new LankaError('unauthorized', 401);
  const session = SessionSchema.parse(readPayload(token));
  if (session.expires < Date.now()) throw new LankaError('session_expired', 401);
  return session;
}
export function assertSameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new LankaError('origin_denied', 403);
}
export function requireOperator(session: LankaSession) {
  if (session.persona !== 'operator') throw new LankaError('forbidden', 403);
}
export function requireAccount(session: LankaSession, accountId: string) {
  if (
    (session.persona === 'customer-a' && accountId === 'DEMO-A') ||
    (session.persona === 'customer-b' && accountId === 'DEMO-B')
  )
    return;
  throw new LankaError('forbidden', 403);
}
