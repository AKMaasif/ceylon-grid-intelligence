import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { verifyFlexibility } from '@mitsinjo/engine';
import {
  EventSchema,
  AuditSchema,
  DEMO_EVENT,
  type LankaAction,
  type LankaSession,
} from '@/features/lanka/contracts';
import { LankaError, readPayload, requireOperator, signPayload } from './security';

export function createSandboxStore(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS lanka_event (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lanka_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS lanka_confirmation (token TEXT PRIMARY KEY, result TEXT NOT NULL);
    INSERT OR IGNORE INTO lanka_event VALUES (1, '{"id":"DEMO-FLEX-001","version":0,"state":"draft","missingInterval":false}');`);
  const readEvent = () =>
    EventSchema.parse(
      JSON.parse(
        (db.prepare('SELECT payload FROM lanka_event WHERE id=1').get() as { payload: string })
          .payload
      )
    );
  const readAudit = () =>
    db
      .prepare('SELECT id,payload FROM lanka_audit ORDER BY id DESC LIMIT 20')
      .all()
      .map((r) => AuditSchema.parse({ ...JSON.parse(String(r.payload)), id: r.id }));
  function assertAction(session: LankaSession, action: LankaAction) {
    if (['publish', 'verify', 'gap', 'restore', 'reset'].includes(action)) requireOperator(session);
    else if (session.persona !== 'customer-a')
      throw new LankaError('interval_account_required', 403);
  }
  function replay(missing: boolean) {
    const start = Date.parse(DEMO_EVENT.starts);
    return verifyFlexibility({
      eventStart: start,
      eventEnd: Date.parse(DEMO_EVENT.ends),
      measurementEnd: Date.parse(DEMO_EVENT.measurementEnds),
      intervals: Array.from({ length: 16 }, (_, i) => ({
        start: start + i * 900_000,
        durationMinutes: 15,
        baselineKw: 4,
        observedKw: missing && i === 3 ? null : i < 8 ? 3 : 4.4,
      })),
    });
  }
  function preview(session: LankaSession, action: LankaAction, version: number) {
    assertAction(session, action);
    if (readEvent().version !== version) throw new LankaError('version_conflict', 409);
    return signPayload({
      persona: session.persona,
      action,
      version,
      expires: Date.now() + 120_000,
      sessionExpires: session.expires,
    });
  }
  function commit(session: LankaSession, action: LankaAction, version: number, token: string) {
    assertAction(session, action);
    const confirmation = z
      .object({
        persona: z.string(),
        action: z.string(),
        version: z.number(),
        expires: z.number(),
        sessionExpires: z.number(),
      })
      .parse(readPayload(token));
    if (
      confirmation.persona !== session.persona ||
      confirmation.action !== action ||
      confirmation.version !== version ||
      confirmation.sessionExpires !== session.expires ||
      confirmation.expires < Date.now()
    )
      throw new LankaError('confirmation_invalid', 403);
    db.exec('BEGIN IMMEDIATE');
    try {
      const previous = db
        .prepare('SELECT result FROM lanka_confirmation WHERE token=?')
        .get(token) as { result: string } | undefined;
      if (previous) {
        db.exec('COMMIT');
        return EventSchema.parse(JSON.parse(previous.result));
      }
      const event = readEvent();
      if (event.version !== version) throw new LankaError('version_conflict', 409);
      const allowed =
        action === 'reset' ||
        action === 'gap' ||
        action === 'restore' ||
        (action === 'publish' && event.state === 'draft') ||
        (['accept', 'decline'].includes(action) && event.state === 'published') ||
        (action === 'withdraw' && event.state === 'accepted') ||
        (action === 'verify' && event.state === 'accepted');
      if (!allowed) throw new LankaError('invalid_transition', 409);
      if (action === 'verify' && replay(event.missingInterval).status !== 'verified_replay')
        throw new LankaError('insufficient_data', 422);
      const next = EventSchema.parse({
        ...event,
        version: event.version + 1,
        state:
          action === 'reset'
            ? 'draft'
            : action === 'publish'
              ? 'published'
              : action === 'accept'
                ? 'accepted'
                : action === 'decline'
                  ? 'declined'
                  : action === 'withdraw'
                    ? 'withdrawn'
                    : action === 'verify'
                      ? 'verified_replay'
                      : event.state === 'verified_replay'
                        ? 'accepted'
                        : event.state,
        missingInterval:
          action === 'reset' || action === 'restore'
            ? false
            : action === 'gap'
              ? true
              : event.missingInterval,
      });
      db.prepare('UPDATE lanka_event SET payload=? WHERE id=1').run(JSON.stringify(next));
      db.prepare('INSERT INTO lanka_audit(payload) VALUES(?)').run(
        JSON.stringify({
          at: new Date().toISOString(),
          actor: session.persona,
          action,
          version: next.version,
        })
      );
      db.prepare('INSERT INTO lanka_confirmation VALUES(?,?)').run(token, JSON.stringify(next));
      db.exec('COMMIT');
      return next;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return { readEvent, readAudit, preview, commit, replay, close: () => db.close() };
}
let store: ReturnType<typeof createSandboxStore> | undefined;
export function getSandboxStore() {
  if (!store) {
    const directory = join(process.cwd(), '.lanka-data');
    mkdirSync(directory, { recursive: true });
    store = createSandboxStore(join(directory, 'sandbox.sqlite'));
  }
  return store;
}
