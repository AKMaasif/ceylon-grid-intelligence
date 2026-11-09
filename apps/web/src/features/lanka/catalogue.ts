import { z } from 'zod';

export const ProvenanceSchema = z.object({
  origin: z.enum(['official_publication', 'synthetic', 'authorized_feed']),
  valueKind: z.enum(['observation', 'simulation', 'calculation']),
  freshness: z.enum(['historical', 'fixture', 'unavailable']),
  quality: z.enum(['source_backed', 'synthetic', 'missing']),
  asOf: z.string().nullable(),
});
export const PilotAssetSchema = z.object({
  id: z.string().startsWith('DEMO-'),
  labelKey: z.string(),
  kind: z.enum(['solar', 'storage', 'load']),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  scope: z.literal('synthetic-pilot'),
  provenance: ProvenanceSchema,
});
const fixtureProvenance = {
  origin: 'synthetic',
  valueKind: 'simulation',
  freshness: 'fixture',
  quality: 'synthetic',
  asOf: '2026-11-07T00:00:00+05:30',
} as const;
export const PILOT_ASSETS = z.array(PilotAssetSchema).parse([
  {
    id: 'DEMO-SOLAR',
    labelKey: 'assetSolar',
    kind: 'solar',
    longitude: 80.45,
    latitude: 8.2,
    scope: 'synthetic-pilot',
    provenance: fixtureProvenance,
  },
  {
    id: 'DEMO-BATTERY',
    labelKey: 'assetBattery',
    kind: 'storage',
    longitude: 80.7,
    latitude: 7.2,
    scope: 'synthetic-pilot',
    provenance: fixtureProvenance,
  },
  {
    id: 'DEMO-PUMP',
    labelKey: 'assetWater',
    kind: 'load',
    longitude: 80.25,
    latitude: 6.45,
    scope: 'synthetic-pilot',
    provenance: fixtureProvenance,
  },
]);
export const SOURCE_CATALOGUE = [
  {
    id: 'gb-LKA-ADM0-54457186',
    domain: 'geography',
    asOf: '2017',
    state: 'historical',
    url: 'https://www.geoboundaries.org/api/current/gbOpen/LKA/ADM0/',
    permission: 'ODbL-1.0',
    coverage: 'ADM0-outline-only',
    provenance: ProvenanceSchema.parse({
      origin: 'official_publication',
      valueKind: 'observation',
      freshness: 'historical',
      quality: 'source_backed',
      asOf: '2017',
    }),
  },
  {
    id: 'synthetic-pilot-v1',
    domain: 'pilot',
    asOf: fixtureProvenance.asOf,
    state: 'synthetic_demo',
    url: null,
    permission: 'project-fixture',
    coverage: 'synthetic-pilot-only',
    provenance: fixtureProvenance,
  },
  {
    id: 'utility-operational-feed',
    domain: 'national',
    asOf: null,
    state: 'unavailable',
    url: null,
    permission: 'not-connected',
    coverage: 'none',
    provenance: ProvenanceSchema.parse({
      origin: 'authorized_feed',
      valueKind: 'observation',
      freshness: 'unavailable',
      quality: 'missing',
      asOf: null,
    }),
  },
];
