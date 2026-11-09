import 'server-only';
import { compare, scenarios, optimizeFlexibleSchedule } from '@mitsinjo/engine';
import { DEMO_ACCOUNTS, DEMO_EVENT, type LankaSession } from '@/features/lanka/contracts';
import { requireAccount, LankaError } from './security';
import { getSandboxStore } from './store';
import { SOURCE_CATALOGUE } from '@/features/lanka/catalogue';

export function workspace(session: LankaSession, scenario: string, accountId?: string) {
  const store = getSandboxStore();
  const event = store.readEvent();
  const common = {
    session,
    event,
    window: DEMO_EVENT,
    verification: event.state === 'verified_replay' ? store.replay(event.missingInterval) : null,
    outage: {
      id: 'DEMO-OUTAGE-001',
      mode: 'synthetic_demo',
      starts: '2026-11-08T09:00:00+05:30',
      ends: '2026-11-08T11:00:00+05:30',
      status: 'scheduled',
      asOf: '2026-11-07T08:00:00+05:30',
    },
  };
  if (session.persona !== 'operator') {
    const account = DEMO_ACCOUNTS[session.persona];
    requireAccount(session, accountId ?? account.id);
    return {
      ...common,
      verification: session.persona === 'customer-a' ? common.verification : null,
      event:
        session.persona === 'customer-a'
          ? common.event
          : { ...common.event, state: 'draft' as const },
      kind: 'customer' as const,
      account,
    };
  }
  if (accountId) throw new LankaError('forbidden', 403);
  if (!['baseline', 'cloudy_afternoon', 'essential_stress'].includes(scenario))
    throw new LankaError('invalid_scenario');
  const definition = scenarios[scenario as 'baseline' | 'cloudy_afternoon' | 'essential_stress'];
  const compared = compare(definition.input);
  if (!compared.proportional || !compared.essential_first || !compared.balanced)
    throw new LankaError('unavailable', 503);
  const results = {
    proportional: compared.proportional,
    essential_first: compared.essential_first,
    balanced: compared.balanced,
  };
  const primary = results.essential_first;
  const schedule = optimizeFlexibleSchedule({
    rates: Array.from({ length: 24 }, (_, h) =>
      h >= 18 && h < 22 ? 45 : h >= 10 && h < 16 ? 12 : 25
    ),
    durationMinutes: 60,
    powerKw: 2,
    requiredSlots: 2,
    earliestSlot: 8,
    deadlineSlot: 22,
    baselineStart: 19,
  });
  return {
    ...common,
    kind: 'operator' as const,
    scenario,
    results,
    schedule,
    audit: store.readAudit(),
    scope: 'synthetic-pilot',
    sources: SOURCE_CATALOGUE,
    primaryRunId: primary.id,
  };
}
export type LankaWorkspace = ReturnType<typeof workspace>;
