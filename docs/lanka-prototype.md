# Lanka connected sandbox

This first implementation adds `/lanka` (operator) and `/customer` (responsive web
companion). `/` opens `/lanka`; original lab routes remain unchanged.

## Run locally

Use Node 22.13+ (CI targets Node 22) and the repository's pnpm version.
Run `pnpm install --frozen-lockfile`, then `pnpm --filter web dev`.
Open `http://localhost:3000/lanka` or the configured port. `make dev-lanka`
also starts the web application. Sandbox access is automatic in dev/test.
For an explicitly local production preview, set `LANKA_DEMO_ENABLED=true` before
starting the built app. It is off by default in production.

Persona selection is public **demonstration access**, not verified utility identity.
Never attach private or operational data to this adapter.

## Connected walkthrough

1. Select operator. Inspect cloudy scenario, allocation policies and pump scheduler.
2. Review and confirm an invitation. Nothing publishes at preview time.
3. In a separate browser context, open `/customer` as the interval customer.
4. Review and confirm acceptance. Acceptance is not measured delivery or reserve.
5. Operator: review the missing-interval test, then attempt replay verification.
   Verification fails and does not report a verified result.
6. Restore the interval and verify: 2 kWh synthetic event reduction, 0.8 kWh rebound
   over two subsequent hours, and 1.2 kWh net across the measurement window.
7. Refresh either view: event/audit remain. The monthly-only customer cannot accept
   or inspect the interval customer's result/account.
8. Review a new demo cycle to reset the event. Audit history is retained.

Operators cannot retrieve customer accounts through this API. Customers cannot
publish, reset, manipulate replay gaps or verify delivery. Duplicate confirmations
return the recorded result without duplicate actions. Stale versions require review.

## Sources and calculations

The map uses an unmodified geoBoundaries ADM0 outline representing 2017. ODbL
attribution and pinned source are in `public/lanka/GEOGRAPHY_SOURCE.txt`. Markers
are fictional examples, not registered plants. SCADA, national plant output,
network flow, billing, AMI/OMS/CRM, payments and forecasting are not connected.

Pilot cards/curves/policy comparisons use `@mitsinjo/engine`. Opening the reference
simulation or lab loads the selected scenario into its existing store. The finite
pump scheduler searches allowed contiguous starts using illustrative rates, not an
approved tariff or national dispatch model. Replay verification is fixture-baseline
accounting, not causal attribution or utility settlement. The hourly engine is
preserved; the new replay function integrates each interval's declared duration.

Sample bills are synthetic records. Their explanation compares fixtures, not actual
appliances or official tariffs. The new explanation panel is deterministic and
explicitly identifies no live LLM. Original copilot routes remain available.

## Persistence and boundaries

Node's SQLite stores event, audit and used confirmations in the gitignored
`<web-working-directory>/.lanka-data/sandbox.sqlite`. Idempotent v1 initialization
creates the tables; transactions serialize state changes. No Neon tables changed
and no Neon migration is required. This single-host adapter is unsuitable for
ephemeral/serverless storage.

HttpOnly/SameSite=Strict session cookies expire in one hour and use a process-local
HMAC key. HTTPS cookies are Secure. Restart invalidates sessions while preserving
the database. Confirmations expire in two minutes and bind persona, session expiry,
exact action and event version. Writes require same origin; responses are no-store.
This is not independently reviewed production identity/audit infrastructure.

New strings use next-intl. EN is complete for this slice; SI/TA are visibly partial
drafts with English fallback. Existing EN/FR/MG lab catalogues remain intact.
Native Android/iOS, push, voice, payment, complaint submission, device control and
verified utility account linking remain future work. `/customer` is web, not native.

## Validation

`make test-lanka` runs focused calculation/API/hook tests; `make e2e-lanka` checks
the browser walkthrough and viewports. `pnpm typecheck` checks all projects;
`pnpm --filter web build` makes the production build. Full web tests use
`pnpm --filter web exec vitest run --maxWorkers=4`.

On Node 26, set `NODE_OPTIONS=--no-experimental-webstorage` for jsdom tests to avoid
its incompatible experimental localStorage global. CI uses Node 22. On PowerShell,
set `$env:NODE_OPTIONS` before the test command. This is an environment workaround,
not a source change to the original tests.

Screenshots: `design/shots/lanka-{1440,390,320}-{dark,light}.png` and
`design/shots/customer-390-light.png`. Manual checks: `test-scenarios/07-lanka.md`.
