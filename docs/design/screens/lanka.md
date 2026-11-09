# Lanka connected sandbox

Routes: `/lanka` (operator), `/customer` (responsive customer companion).
Built without Stitch mockup: new composed surfaces. Preserve original lab routes.

Layout: compact brand/navigation rail; upper provenance banner; operator hero with
scope selector and scenario controls; three engine metric cards; sourced Sri Lanka
outline and explicitly synthetic pilot markers beside a demand chart; lower strategy
comparison, finite scheduling comparison, evidence, flexibility event and audit.
Customer: account card, bill/usage explanation, shared outage notice and offer card
with review/confirm actions. Monthly-only fixture must never show interval charts.

Use existing semantic theme tokens. Operator desktop 12-column grid; mobile one
column, >=44px targets, bottom navigation and `pb-20 md:pb-6`. Show all units and
Asia/Colombo times. Never expose customer records to the general operator map.
Use nested next-intl messages for EN/SI/TA; translations are draft prototype copy.
Show sandbox persona selection as unverified demo access, never utility login.
No national totals, live readings or forecasts without sources; display unavailable.

The operator can preview and confirm publishing a fixture offer. An interval-data
customer can review/accept/decline. Only the operator can verify a fixed synthetic
replay; missing intervals must block verification. Full-window rebound is visible.
Persist sandbox events and audit in a local SQLite store, with signed session cookies.
