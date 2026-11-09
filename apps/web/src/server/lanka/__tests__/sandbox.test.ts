// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSandboxStore } from '../store';
import { parseSession, signPayload, requireAccount, assertSameOrigin } from '../security';
import type { LankaAction, LankaSession } from '@/features/lanka/contracts';

const operator: LankaSession = { persona: 'operator', expires: Date.now() + 60_000 };
const customer: LankaSession = { persona: 'customer-a', expires: operator.expires };
describe('Lanka sandbox policy and transitions', () => {
  it('requires signed unexpired sessions and blocks object access', () => {
    expect(parseSession(signPayload(operator))).toEqual(operator);
    expect(() => parseSession(signPayload({ ...operator, expires: 0 }))).toThrow('session_expired');
    expect(() => parseSession(signPayload(operator) + 'x')).toThrow('unauthorized');
    expect(() => requireAccount(customer, 'DEMO-B')).toThrow('forbidden');
    expect(() => requireAccount(operator, 'DEMO-A')).toThrow('forbidden');
    expect(() =>
      assertSameOrigin(
        new Request('http://localhost/api', { headers: { origin: 'https://evil.example' } })
      )
    ).toThrow('origin_denied');
  });
  it('publishes, accepts and verifies exactly once, keeping the audit', () => {
    const store = createSandboxStore(':memory:');
    const apply = (who: LankaSession, action: LankaAction) => {
      const version = store.readEvent().version;
      const token = store.preview(who, action, version);
      return { token, version, event: store.commit(who, action, version, token) };
    };
    try {
      expect(() => store.preview(customer, 'publish', 0)).toThrow('forbidden');
      expect(() => store.preview({ ...customer, persona: 'customer-b' }, 'accept', 0)).toThrow(
        'interval_account_required'
      );
      apply(operator, 'publish');
      const accepted = apply(customer, 'accept');
      expect(store.commit(customer, 'accept', accepted.version, accepted.token)).toEqual(
        accepted.event
      );
      expect(store.readAudit()).toHaveLength(2);
      apply(operator, 'gap');
      expect(() => apply(operator, 'verify')).toThrow('insufficient_data');
      apply(operator, 'restore');
      expect(apply(operator, 'verify').event.state).toBe('verified_replay');
      expect(store.replay(false).netKwh).toBeCloseTo(1.2);
      expect(store.readAudit()).toHaveLength(5);
    } finally {
      store.close();
    }
  });
  it('binds confirmation to action, version and session and handles stale proposals', () => {
    const store = createSandboxStore(':memory:');
    try {
      const token = store.preview(operator, 'publish', 0);
      expect(() => store.commit(operator, 'reset', 0, token)).toThrow('confirmation_invalid');
      expect(() =>
        store.commit({ ...operator, expires: operator.expires + 1 }, 'publish', 0, token)
      ).toThrow('confirmation_invalid');
      const stale = store.preview(operator, 'reset', 0);
      store.commit(operator, 'publish', 0, token);
      expect(() => store.commit(operator, 'reset', 0, stale)).toThrow('version_conflict');
    } finally {
      store.close();
    }
  });
});
