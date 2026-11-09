'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PILOT_ASSETS } from '../catalogue';

const sites = PILOT_ASSETS.map((asset) => ({ ...asset, key: asset.labelKey }));
const project = (point: number[]) => [(point[0]! - 79.4) * 120 + 30, (10 - point[1]!) * 100 + 15];
type Geometry = { type: string; coordinates: number[][][] | number[][][][] };
function outline(geometry: Geometry) {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as number[][][]]
      : (geometry.coordinates as number[][][][]);
  return polygons
    .flatMap((polygon) =>
      polygon.map(
        (ring) =>
          ring.map((point, index) => `${index ? 'L' : 'M'}${project(point).join(',')}`).join(' ') +
          'Z'
      )
    )
    .join(' ');
}
export function GeoMap() {
  const t = useTranslations();
  const [path, setPath] = useState('');
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/lanka/sri-lanka.geojson', { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error('geography');
        return r.json();
      })
      .then((geo) =>
        setPath(
          geo.features.map((feature: { geometry: Geometry }) => outline(feature.geometry)).join(' ')
        )
      )
      .catch(() => {
        if (!abort.signal.aborted) setFailed(true);
      });
    return () => abort.abort();
  }, []);
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_170px]">
      <div className="relative rounded-card border border-border bg-canvas-sunken">
        {failed ? (
          <p className="p-8 text-text-secondary">{t('errors.unavailable')}</p>
        ) : (
          <svg
            viewBox="0 0 360 450"
            className="h-[350px] w-full sm:h-[410px]"
            role="img"
            aria-label={t('mapLabel')}
          >
            <defs>
              <pattern id="lanka-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path
                  d="M30 0H0V30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-border"
                />
              </pattern>
            </defs>
            <rect width="360" height="450" fill="url(#lanka-grid)" />
            <path
              d={path}
              fill="currentColor"
              className="text-surface-elevated"
              stroke="var(--color-border-strong)"
              strokeWidth="1.5"
              fillRule="evenodd"
            />
            {sites.map((site, index) => {
              const [x, y] = project([site.longitude, site.latitude]);
              return (
                <g key={site.key}>
                  {index === selected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="17"
                      fill="none"
                      stroke="currentColor"
                      className="text-energy-cyan"
                      opacity="0.35"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={index === selected ? 7 : 5}
                    fill="currentColor"
                    className={index === selected ? 'text-energy-cyan' : 'text-solar-amber'}
                  />
                </g>
              );
            })}
          </svg>
        )}
        <span className="absolute left-3 top-3 rounded-control-sm border border-border bg-surface px-2 py-1 text-[10px] font-mono text-text-secondary">
          {t('geography')}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-text-muted">{t('selectedAsset')}</p>
        {sites.map((site, index) => (
          <button
            key={site.key}
            onClick={() => setSelected(index)}
            aria-pressed={index === selected}
            className={`min-h-11 rounded-control border px-3 py-3 text-left text-xs transition-colors ${index === selected ? 'border-energy-cyan bg-energy-cyan/10 text-energy-cyan' : 'border-border text-text-secondary hover:bg-surface-hover'}`}
          >
            {t(site.key)}
          </button>
        ))}
        <p className="mt-auto pt-4 text-xs leading-relaxed text-text-muted">{t('noTelemetry')}</p>
        <a
          className="text-[10px] leading-relaxed text-text-secondary underline"
          href="https://www.geoboundaries.org/api/current/gbOpen/LKA/ADM0/"
          target="_blank"
          rel="noreferrer"
        >
          {t('attribution')}
        </a>
      </div>
    </div>
  );
}
