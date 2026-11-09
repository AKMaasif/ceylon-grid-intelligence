// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSandboxStore } from '../store';
import { signPayload } from '../security';
import { GET, POST } from '@/app/api/lanka/route';

let cookie: string | undefined;
let store: ReturnType<typeof createSandboxStore>;
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (cookie ? { value: cookie } : undefined) }),
}));
vi.mock('../store', async (original) => ({
  ...(await original<typeof import('../store')>()),
  getSandboxStore: () => store,
}));

beforeEach(() => {
  cookie = undefined;
  store = createSandboxStore(':memory:');
});
afterEach(() => store.close());
const login = (persona: string) => {
  cookie = signPayload({ persona, expires: Date.now() + 60_000 });
};
const post = (body: unknown, origin = 'http://localhost') =>
  POST(
    new Request('http://localhost/api/lanka', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
describe('role-scoped Lanka API', () => {
  it('requires authentication and rejects cross-origin writes', async () => {
    expect((await GET(new Request('http://localhost/api/lanka'))).status).toBe(401);
    login('operator');
    expect((await post({ action: 'publish', version: 0 }, 'https://evil.example')).status).toBe(
      403
    );
  });
  it('prevents customer account enumeration and operator data leakage', async () => {
    login('customer-a');
    expect((await GET(new Request('http://localhost/api/lanka?account=DEMO-B'))).status).toBe(403);
    const body = await (await GET(new Request('http://localhost/api/lanka'))).json();
    expect(body.account.id).toBe('DEMO-A');
    expect(body.audit).toBeUndefined();
    expect(body.results).toBeUndefined();
    expect((await post({ action: 'publish', version: 0 })).status).toBe(403);
  });
  it('records the action only after a version-bound confirmation', async () => {
    login('operator');
    const preview = await (await post({ action: 'publish', version: 0 })).json();
    expect(store.readEvent().state).toBe('draft');
    expect(
      (await post({ action: 'publish', version: 0, confirmation: preview.confirmation })).status
    ).toBe(200);
    expect(store.readEvent().state).toBe('published');
    expect(
      (await post({ action: 'publish', version: 0, confirmation: preview.confirmation })).status
    ).toBe(200);
    expect(store.readAudit()).toHaveLength(1);
  });
});
