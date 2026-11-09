import { z } from 'zod';

export const PersonaSchema = z.enum(['operator', 'customer-a', 'customer-b']);
export type Persona = z.infer<typeof PersonaSchema>;
export const ActionSchema = z.enum([
  'publish',
  'accept',
  'decline',
  'withdraw',
  'verify',
  'gap',
  'restore',
  'reset',
]);
export type LankaAction = z.infer<typeof ActionSchema>;
export const SessionSchema = z.object({ persona: PersonaSchema, expires: z.number().int() });
export type LankaSession = z.infer<typeof SessionSchema>;
export const EventSchema = z.object({
  id: z.literal('DEMO-FLEX-001'),
  version: z.number().int().nonnegative(),
  state: z.enum(['draft', 'published', 'accepted', 'declined', 'withdrawn', 'verified_replay']),
  missingInterval: z.boolean(),
});
export type LankaEvent = z.infer<typeof EventSchema>;
export const AuditSchema = z.object({
  id: z.number().int(),
  at: z.string(),
  actor: PersonaSchema,
  action: ActionSchema,
  version: z.number().int(),
});
export type LankaAudit = z.infer<typeof AuditSchema>;
export const MutationSchema = z.object({
  action: ActionSchema,
  version: z.number().int().nonnegative(),
  confirmation: z.string().min(10).max(2048).optional(),
});
export const DEMO_EVENT = {
  id: 'DEMO-FLEX-001' as const,
  starts: '2026-11-07T19:00:00+05:30',
  ends: '2026-11-07T21:00:00+05:30',
  measurementEnds: '2026-11-07T23:00:00+05:30',
  source: 'synthetic-interval-fixture-v1',
};
export const DEMO_ACCOUNTS = {
  'customer-a': {
    id: 'DEMO-A',
    resolution: '15-minute',
    billLkr: 3480,
    previousBillLkr: 3200,
    usageKwh: 132,
    previousKwh: 120,
    billDeltaLkr: 280,
    usageDeltaKwh: 12,
  },
  'customer-b': {
    id: 'DEMO-B',
    resolution: 'monthly',
    billLkr: 1800,
    previousBillLkr: 1800,
    usageKwh: 78,
    previousKwh: 78,
    billDeltaLkr: 0,
    usageDeltaKwh: 0,
  },
} as const;
