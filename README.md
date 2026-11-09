# Ceylon Grid Intelligence

AI-assisted energy monitoring and customer care for Sri Lanka: a connected,
synthetic-data prototype built on the open-source Mitsinjo Grid reference.

## Current prototype

- Operator workspace with sourced Sri Lanka geography and clearly labelled fictional pilot assets.
- Deterministic energy simulation and comparison of proportional, essential-first and balanced allocation.
- Constrained pump scheduling with reproducible calculations and illustrative costs.
- Separate operator and customer sandbox sessions with server-side access checks.
- Reviewed flexibility invitations, customer acceptance/decline and interval-replay verification.
- Missing-data checks, rebound accounting, local SQLite persistence and event audit.
- Responsive customer companion with sample bills, explanations and a shared service notice.
- Preserved reference simulation, 3D/2D views, scenario library, copilot and photo-assisted editor.

**This is not live national telemetry, verified utility authentication or a production
grid-control system.** All pilot energy readings, customer identities and bills are
synthetic. The customer application is responsive web; native Android/iOS clients,
trained national forecasts, payments, voice and utility integrations remain roadmap work.
The new explanation panels use deterministic templates; the original reference
copilot remains separate. Sinhala/Tamil copy is a partial prototype draft.

## Run locally

Requirements: Node.js 22.13+ and pnpm 10.29.3 (as declared in package.json).

```powershell
pnpm install --frozen-lockfile
pnpm --filter web dev
```

Open the printed local URL at `/lanka` for monitoring or `/customer` for customer
care. Original lab routes remain at `/overview`, `/simulation`, `/strategies`,
`/scenarios`, `/copilot`, and `/village`.

Sandbox persona selection is intentionally available in development/test and must
only use synthetic records. It is disabled by default in production. For a local
production preview only, explicitly set `LANKA_DEMO_ENABLED=true`. Never use this
sandbox login with real customer or operational data.

## Connected demonstration

1. Enter the operator sandbox and review the scenario/strategy evidence.
2. Review and confirm publishing a flexibility invitation.
3. Open a separate browser context as the interval-data demo customer and accept.
4. Introduce a missing replay interval: verification must be blocked.
5. Restore the interval and verify the synthetic replay, including rebound.
6. Inspect the shared outcome and persistent audit trail.

Monthly-only customers cannot verify a two-hour response or access another account.
See [the setup, walkthrough and limitations](docs/lanka-prototype.md).

## Validation

```powershell
pnpm typecheck
pnpm --filter web build
pnpm --filter web exec vitest run src/server/lanka src/features/lanka
pnpm --filter web exec playwright test e2e/lanka-connected.spec.ts
```

On Node 26, jsdom tests need `NODE_OPTIONS=--no-experimental-webstorage`; CI targets
Node 22. More commands and verification details are in the prototype guide.

## Architecture and roadmap

The monorepo retains a Next.js/React operator application, a pure TypeScript energy
engine, and an optional local scale-model bridge. The new customer companion uses
permission-controlled APIs and a single-host SQLite sandbox adapter. This adapter
requires writable local storage and is not suitable for ephemeral/serverless hosting.

Next work: authorized historical-data imports and plant registry, source-backed
national monitoring, forecasting evaluation, scoped AI orchestration, native mobile,
and supported utility integrations. No real SCADA switching commands are exposed.

- [Architecture](docs/architecture.md)
- [Data and API contracts](docs/contracts.md)
- [Engine specification](docs/engine-spec.md)
- [Connected prototype implementation checklist](docs/tasks/PN-lanka-connected.md)

## Attribution and licensing

This project adapts [Mitsinjo Grid by Tokiarivelo](https://github.com/Tokiarivelo/mitsinjo-grid),
starting from commit `1315ce9e8679be14da59ab73d64944afb64298b6`.
The original Git history and [MIT license](LICENSE) are preserved. The original
project's hackathon provenance and from-scratch claims describe that upstream work,
not this derivative. Its README is archived [here](docs/reference/mitsinjo-grid-readme.md).

Our additions include the Sri Lanka geography/catalogue, operator/customer sandbox,
reviewed flexibility workflow, interval verification, constrained scheduler and tests.
Third-party geography and SAM parser notices remain in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The geography source is attributed
in the UI and its bundled source note. No upstream live demo is a deployment of this repository.
