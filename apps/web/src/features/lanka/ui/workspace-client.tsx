'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  GitCompareArrows,
  Globe2,
  Layers3,
  LayoutDashboard,
  LogOut,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useSimulationStore } from '@/stores';
import type { ScenarioId } from '@mitsinjo/engine';
import { useWorkspace } from '../hooks/use-workspace';
import type { LankaAction } from '../contracts';
import type { LankaWorkspace } from '@/server/lanka/workspace';
import en from '../messages/en.json';
import si from '../messages/si.json';
import ta from '../messages/ta.json';
import { GeoMap } from './geo-map';

type OperatorData = Extract<LankaWorkspace, { kind: 'operator' }>;
type CustomerData = Extract<LankaWorkspace, { kind: 'customer' }>;
const number = (value: number, decimals = 1) =>
  new Intl.NumberFormat('en-LK', { maximumFractionDigits: decimals }).format(value);
const time = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-hover disabled:cursor-wait disabled:opacity-50';

function ConfirmationModal({ close, children }: { close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      aria-labelledby="confirmation-title"
      className="fixed inset-0 m-auto max-h-[90dvh] max-w-[calc(100vw-2rem)] overflow-auto rounded-card bg-transparent p-0 text-text-primary backdrop:bg-canvas/85 backdrop:backdrop-blur-sm"
    >
      {children}
    </dialog>
  );
}

function Panel({
  title,
  description,
  children,
  id,
  icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
  icon?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="min-w-0 scroll-mt-5 rounded-card border border-border bg-surface p-4 sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3">
        {icon && (
          <div className="rounded-control border border-border p-2 text-energy-cyan">{icon}</div>
        )}
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
        {label}
        <span className="text-energy-cyan">{icon}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-medium tracking-tight">
        {number(value)} <span className="font-mono text-sm text-text-muted">{unit}</span>
      </p>
    </div>
  );
}

function PilotChart({ data }: { data: OperatorData }) {
  const t = useTranslations();
  const steps = data.results.essential_first.steps;
  const max = Math.max(1, ...steps.flatMap((step) => [step.solarKw, step.demandKw]));
  const points = (key: 'solarKw' | 'demandKw') =>
    steps.map((step, i) => `${30 + i * 18},${190 - (step[key] / max) * 145}`).join(' ');
  return (
    <>
      <svg role="img" aria-label={t('chartLabel')} viewBox="0 0 480 230" className="w-full">
        {[45, 94, 142, 190].map((y) => (
          <line
            key={y}
            x1="30"
            y1={y}
            x2="445"
            y2={y}
            stroke="currentColor"
            className="text-border"
            strokeDasharray="3 5"
          />
        ))}
        <polyline
          points={points('solarKw')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-solar-amber"
        />
        <polyline
          points={points('demandKw')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-energy-cyan"
        />
        {[0, 6, 12, 18, 23].map((hour) => (
          <text
            key={hour}
            x={30 + hour * 18}
            y="216"
            fill="currentColor"
            className="text-text-muted"
            fontSize="10"
            textAnchor="middle"
          >
            {String(hour).padStart(2, '0')}:00
          </text>
        ))}
        <text x="30" y="24" fill="currentColor" className="text-text-muted" fontSize="10">
          {number(max)} {t('unitKw')}
        </text>
      </svg>
      <div className="flex gap-5 text-xs">
        <span className="text-solar-amber">● {t('solarLegend')}</span>
        <span className="text-energy-cyan">● {t('demandLegend')}</span>
      </div>
      <details className="mt-4 text-xs text-text-secondary">
        <summary className="min-h-11 cursor-pointer py-3">{t('chartLabel')}</summary>
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>{t('tableHour')}</th>
                <th>
                  {t('solarLegend')} ({t('unitKw')})
                </th>
                <th>
                  {t('demandLegend')} ({t('unitKw')})
                </th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.t}>
                  <td>{step.t}:00</td>
                  <td>{number(step.solarKw)}</td>
                  <td>{number(step.demandKw)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function Flexibility({
  data,
  busy,
  preview,
}: {
  data: LankaWorkspace;
  busy: boolean;
  preview: (action: LankaAction) => void;
}) {
  const t = useTranslations();
  const operator = data.kind === 'operator';
  const eligible = data.session.persona === 'customer-a';
  const actions: LankaAction[] = operator
    ? [
        ...(data.event.state === 'draft' ? ['publish' as const] : []),
        ...(data.event.state === 'accepted' ? ['verify' as const] : []),
        data.event.missingInterval ? 'restore' : 'gap',
        'reset',
      ]
    : !eligible
      ? []
      : data.event.state === 'published'
        ? ['accept', 'decline']
        : data.event.state === 'accepted'
          ? ['withdraw']
          : [];
  return (
    <Panel
      id="flexibility"
      title={t('eventTitle')}
      description={t('eventBody')}
      icon={<Users size={18} />}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-energy-cyan/30 bg-energy-cyan/10 px-3 py-1.5 text-xs text-energy-cyan">
          {t(data.event.state)}
        </span>
        <span className="font-mono text-[10px] text-text-muted">
          {data.event.id} · v{data.event.version}
        </span>
      </div>
      <div className="my-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-control bg-canvas p-4">
          <p className="text-xs text-text-muted">{t('window')}</p>
          <p className="mt-2 font-mono text-sm">
            {time(data.window.starts)}–{time(data.window.ends)}
          </p>
        </div>
        <div className="rounded-control bg-canvas p-4">
          <p className="text-xs text-text-muted">{t('replayWindow')}</p>
          <p className="mt-2 font-mono text-sm">{time(data.window.measurementEnds)}</p>
        </div>
      </div>
      {data.event.missingInterval && (
        <p
          role="status"
          className="mb-4 rounded-control border border-warning-amber/40 bg-warning-amber/10 p-3 text-xs leading-relaxed text-warning-amber"
        >
          {t('gapWarning')}
        </p>
      )}
      {!operator && !eligible && (
        <p className="mb-4 text-sm leading-relaxed text-text-secondary">{t('monthlyWarning')}</p>
      )}
      {!operator && data.event.state === 'draft' && (
        <p className="mb-4 text-sm text-text-secondary">{t('noOffer')}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action}
            disabled={busy}
            onClick={() => preview(action)}
            className={`${buttonClass} ${['publish', 'accept', 'verify'].includes(action) ? 'border-energy-cyan/50 bg-energy-cyan/10 text-energy-cyan' : 'text-text-secondary'}`}
          >
            {t(action)}
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
      {data.verification && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(['reduction', 'rebound', 'net'] as const).map((key) => (
            <div
              key={key}
              className="rounded-control border border-battery-green/30 bg-battery-green/5 p-4"
            >
              <p className="text-xs text-text-secondary">{t(key)}</p>
              <p className="mt-2 font-mono text-xl text-battery-green">
                {number(
                  (key === 'reduction'
                    ? data.verification!.reductionKwh
                    : key === 'rebound'
                      ? data.verification!.reboundKwh
                      : data.verification!.netKwh) ?? 0
                )}{' '}
                <span className="text-xs">{t('unitKwh')}</span>
              </p>
            </div>
          ))}
        </div>
      )}
      {data.verification && (
        <p className="mt-3 break-all font-mono text-[10px] text-text-muted">
          {data.verification.id} · {data.verification.modelVersion}
        </p>
      )}
      <p className="mt-4 text-xs text-text-muted">{t('noReward')}</p>
    </Panel>
  );
}

function OperatorWorkspace({
  data,
  scenario,
  setScenario,
  busy,
  preview,
}: {
  data: OperatorData;
  scenario: string;
  setScenario: (value: string) => void;
  busy: boolean;
  preview: (action: LankaAction) => void;
}) {
  const t = useTranslations();
  const [evidence, setEvidence] = useState(false);
  const loadReferenceScenario = useSimulationStore((s) => s.loadScenario);
  const metrics = data.results.essential_first.metrics;
  return (
    <>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs text-energy-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-energy-cyan" />
            {t('scope')}
          </p>
          <h1 className="max-w-xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {t('subtitle')}
          </p>
        </div>
        <label className="shrink-0 text-xs text-text-secondary">
          {t('scenario')}
          <select
            aria-label={t('scenario')}
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {['baseline', 'cloudy_afternoon', 'essential_stress'].map((key) => (
              <option key={key} value={key}>
                {t(key)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t('solar')}
          value={metrics.solarKwh}
          unit={t('unitKwh')}
          icon={<Sun size={18} />}
        />
        <Metric
          label={t('demand')}
          value={metrics.demandKwh}
          unit={t('unitKwh')}
          icon={<Activity size={18} />}
        />
        <Metric
          label={t('coverage')}
          value={metrics.criticalCoveragePct}
          unit={t('unitPct')}
          icon={<ShieldCheck size={18} />}
        />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
        <Panel
          id="map"
          title={t('mapTitle')}
          description={t('mapBody')}
          icon={<Globe2 size={18} />}
        >
          <GeoMap />
        </Panel>
        <Panel title={t('chartTitle')} description={t('chartBody')} icon={<Activity size={18} />}>
          <PilotChart data={data} />
          <p className="mt-3 break-all font-mono text-[10px] text-text-muted">
            {t('run')}: {data.primaryRunId}
          </p>
          <Link
            href="/simulation"
            onClick={() => loadReferenceScenario(scenario as ScenarioId)}
            className={`${buttonClass} mt-5 w-full text-energy-cyan`}
          >
            {t('openTwin')}
            <ArrowRight size={15} />
          </Link>
        </Panel>
      </div>
      <Panel
        id="strategies"
        title={t('strategyTitle')}
        description={t('strategyBody')}
        icon={<GitCompareArrows size={18} />}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(data.results).map(([key, result]) => (
            <div
              key={key}
              className={`rounded-control border p-4 ${key === 'essential_first' ? 'border-energy-cyan/40 bg-energy-cyan/5' : 'border-border bg-canvas'}`}
            >
              <h3 className="font-display text-sm font-semibold">{t(key)}</h3>
              <p className="my-4 font-display text-3xl">
                {number(result.metrics.criticalCoveragePct)}
                <span className="text-base text-text-muted">%</span>
              </p>
              <p className="text-xs text-text-secondary">{t('coverage')}</p>
              <dl className="mt-4 space-y-3 text-xs">
                {[
                  [t('unserved'), `${number(result.metrics.unservedKwh)} ${t('unitKwh')}`],
                  [t('reserve'), `${number(result.metrics.socEndPct)}%`],
                  [t('violations'), result.metrics.violations],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-3">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 break-all font-mono text-[9px] text-text-muted">{result.id}</p>
            </div>
          ))}
        </div>
        <Link
          href="/strategies"
          onClick={() => loadReferenceScenario(scenario as ScenarioId)}
          className={`${buttonClass} mt-4 text-text-secondary`}
        >
          {t('openLab')}
          <ArrowRight size={14} />
        </Link>
      </Panel>
      <Panel
        title={t('scheduleTitle')}
        description={t('scheduleBody')}
        icon={<BatteryCharging size={18} />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['currentSchedule', data.schedule.baselineStart, data.schedule.baselineCost],
            ['timerSchedule', data.schedule.timerStart, data.schedule.timerCost],
            ['optimalSchedule', data.schedule.optimizedStart, data.schedule.optimizedCost],
          ].map(([label, start, cost]) => (
            <div key={label} className="rounded-control border border-border bg-canvas p-4">
              <p className="text-xs text-text-secondary">{t(String(label))}</p>
              <p className="mt-3 font-mono text-xl">{start}:00</p>
              <p className="mt-2 text-sm text-energy-cyan">
                {t('unitLkr')} {number(Number(cost))}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
          <span className="text-text-secondary">
            {t('energySame')}: {number(data.schedule.energyKwh)} {t('unitKwh')}
          </span>
          <span className="text-battery-green">
            <ArrowDownRight size={16} className="inline" /> {t('saving')}: {t('unitLkr')}{' '}
            {number(data.schedule.savings)}
          </span>
        </div>
        <button
          onClick={() => setEvidence(!evidence)}
          aria-expanded={evidence}
          className={`${buttonClass} mt-4 text-ai-violet`}
        >
          <Sparkles size={15} />
          {t('explain')}
        </button>
        {evidence && (
          <div className="mt-4 rounded-control border border-ai-violet/30 bg-ai-violet/5 p-4">
            <h3 className="text-xs font-semibold text-ai-violet">{t('evidenceTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t('evidenceBody')}</p>
            <p className="mt-3 break-all font-mono text-xs">
              {data.primaryRunId}
              <br />
              {data.schedule.id}
            </p>
          </div>
        )}
      </Panel>
      <Flexibility data={data} busy={busy} preview={preview} />
      <ServiceNotice data={data} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel id="sources" title={t('sourceTitle')} icon={<Database size={18} />}>
          <div className="space-y-3">
            {['sourceGeo', 'sourcePilot', 'sourceUtility'].map((key, i) => (
              <div
                key={key}
                className="flex gap-3 rounded-control border border-border p-3 text-xs"
              >
                <span className={i === 2 ? 'text-warning-amber' : 'text-energy-cyan'}>
                  {i === 2 ? <CircleHelp size={15} /> : <CheckCircle2 size={15} />}
                </span>
                <div>
                  <p>{t(key)}</p>
                  <p className="mt-1 break-all font-mono text-[10px] text-text-muted">
                    {data.sources[i]!.id} · {data.sources[i]!.asOf ?? '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-text-muted">{t('persistence')}</p>
        </Panel>
        <Panel title={t('auditTitle')} icon={<FileText size={18} />}>
          {data.audit.length === 0 ? (
            <p className="text-sm text-text-secondary">{t('auditEmpty')}</p>
          ) : (
            <ol className="max-h-64 space-y-3 overflow-auto">
              {data.audit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 border-b border-border pb-3 text-xs"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-energy-cyan" />
                  <div className="min-w-0 flex-1">
                    <p>{t(entry.action)}</p>
                    <p className="mt-1 text-text-muted">
                      {t('auditActor')}: {entry.actor} · v{entry.version}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[10px] text-text-muted">
                    {dateTime(entry.at)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}

function ServiceNotice({ data }: { data: LankaWorkspace }) {
  const t = useTranslations();
  return (
    <Panel title={t('outageTitle')} description={t('outageBody')} icon={<RadioTower size={18} />}>
      <p className="font-mono text-xl">
        {dateTime(data.outage.starts)}–{time(data.outage.ends)}
      </p>
      <p className="mt-3 text-xs text-text-muted">
        {t('asOf')}: {dateTime(data.outage.asOf)}
        <br />
        {data.outage.id}
      </p>
    </Panel>
  );
}

function CustomerWorkspace({
  data,
  busy,
  preview,
}: {
  data: CustomerData;
  busy: boolean;
  preview: (action: LankaAction) => void;
}) {
  const t = useTranslations();
  const [explainBill, setExplainBill] = useState(false);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <p className="mb-3 text-xs text-energy-cyan">{t('customer')}</p>
        <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
          {t('accountTitle')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t('accountBody')}</p>
      </div>
      <Panel title={t('account')} icon={<Smartphone size={18} />}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-lg">{data.account.id}</span>
          <span className="rounded-full bg-energy-cyan/10 px-3 py-1 text-xs text-energy-cyan">
            {t(data.account.resolution === 'monthly' ? 'monthly' : 'interval')}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Metric
            label={t('amount')}
            value={data.account.billLkr}
            unit={t('unitLkr')}
            icon={<FileText size={16} />}
          />
          <Metric
            label={t('usage')}
            value={data.account.usageKwh}
            unit={t('unitKwh')}
            icon={<Activity size={16} />}
          />
        </div>
        <button
          onClick={() => setExplainBill(!explainBill)}
          aria-expanded={explainBill}
          className={`${buttonClass} mt-5 text-ai-violet`}
        >
          <Sparkles size={15} />
          {t('billExplain')}
        </button>
        {explainBill && (
          <p className="mt-4 rounded-control border border-ai-violet/30 bg-ai-violet/5 p-4 text-sm leading-relaxed text-text-secondary">
            {t('billExplanation', {
              usage: data.account.usageDeltaKwh,
              cost: data.account.billDeltaLkr,
            })}
          </p>
        )}
      </Panel>
      <ServiceNotice data={data} />
      <Flexibility data={data} busy={busy} preview={preview} />
      <p className="rounded-card border border-border p-4 text-xs leading-relaxed text-text-muted">
        {t('careNotice')}
      </p>
    </div>
  );
}

function Workspace({ locale, setLocale }: { locale: string; setLocale: (locale: string) => void }) {
  const t = useTranslations();
  const state = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const appropriateView =
    state.data &&
    (pathname === '/customer' ? state.data.kind === 'customer' : state.data.kind === 'operator');
  const { isDark, toggleTheme } = useTheme();
  const navigation = [
    ['overview', '#overview', LayoutDashboard],
    ['map', '#map', Globe2],
    ['strategies', '#strategies', Layers3],
    ['flexibility', '#flexibility', Users],
    ['sources', '#sources', Database],
  ] as const;
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-text-primary">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface p-5 lg:flex">
        <Link href="/lanka" className="flex min-h-11 items-center gap-3">
          <RadioTower className="text-energy-cyan" size={27} />
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.16em]">{t('brand')}</p>
            <p className="mt-1 text-[8px] tracking-[0.13em] text-text-muted">{t('brandSub')}</p>
          </div>
        </Link>
        <div className="my-7 h-px bg-border" />
        <p className="mb-3 text-[10px] uppercase tracking-widest text-text-muted">
          {t('operator')}
        </p>
        <nav className="space-y-1">
          {navigation.map(([key, href, Icon]) => (
            <a
              key={key}
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-control px-3 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              <Icon size={16} />
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t border-border pt-5">
          <Link
            href="/customer"
            className="flex min-h-11 items-center gap-3 text-xs text-text-secondary"
          >
            <Smartphone size={16} />
            {t('customer')}
          </Link>
          <Link
            href="/overview"
            className="flex min-h-11 items-center gap-3 text-xs text-text-secondary"
          >
            <GitCompareArrows size={16} />
            {t('reference')}
            <ArrowRight size={12} />
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-17 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-8">
          <div>
            <p className="font-display text-sm font-semibold">
              {state.data?.kind === 'customer' ? t('customer') : t('overview')}
            </p>
            <p className="mt-1 text-[10px] text-text-muted">{t('national')}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="lanka-language">
              {t('language')}
            </label>
            <select
              id="lanka-language"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="min-h-11 max-w-28 rounded-control border border-border bg-surface px-2 text-xs"
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
            <button
              onClick={toggleTheme}
              aria-label={t('theme')}
              aria-pressed={!isDark}
              className={`${buttonClass} px-3`}
            >
              <Sun size={16} />
            </button>
            {state.data && (
              <button
                onClick={state.logout}
                disabled={state.busy}
                aria-label={t('signOut')}
                className={`${buttonClass} px-3`}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>
        <main id="overview" className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-8 lg:pb-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-control border border-solar-amber/25 bg-solar-amber/5 px-4 py-3">
              <span className="font-mono text-[10px] font-semibold tracking-wide text-solar-amber">
                {t('sandbox')}
              </span>
              <p className="text-[11px] text-text-secondary">{t('disclaimer')}</p>
            </div>
            {state.error && (
              <p
                role="alert"
                className="rounded-control border border-critical-red/40 bg-critical-red/10 p-4 text-sm text-critical-red"
              >
                {t('error')}:{' '}
                {t.has(`errors.${state.error}`)
                  ? t(`errors.${state.error}`)
                  : t('errors.unavailable')}
              </p>
            )}
            {state.loading ? (
              <p role="status" className="py-20 text-center text-text-secondary">
                {t('loading')}
              </p>
            ) : !state.data || !appropriateView ? (
              <div className="grid gap-8 rounded-card border border-border bg-surface p-6 md:grid-cols-2 md:p-12">
                <div>
                  <RadioTower size={42} className="mb-7 text-energy-cyan" />
                  <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    {t('welcome')}
                  </h1>
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-text-secondary">
                    {t('welcomeBody')}
                  </p>
                  <ul className="mt-7 space-y-4">
                    {['welcomePoint1', 'welcomePoint2', 'welcomePoint3'].map((key) => (
                      <li key={key} className="flex items-start gap-3 text-sm text-text-secondary">
                        <ShieldCheck size={18} className="shrink-0 text-energy-cyan" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  {(['operator', 'customer-a', 'customer-b'] as const).map((persona, i) => (
                    <button
                      key={persona}
                      disabled={state.busy}
                      onClick={async () => {
                        await state.login(persona);
                        router.push(persona === 'operator' ? '/lanka' : '/customer');
                      }}
                      className={`${buttonClass} justify-between px-5 py-5 text-left ${i === 0 ? 'border-energy-cyan/50 bg-energy-cyan/10 text-energy-cyan' : 'text-text-secondary'}`}
                    >
                      {t(i === 0 ? 'enterOperator' : i === 1 ? 'enterCustomer' : 'enterMonthly')}
                      <ArrowRight size={18} />
                    </button>
                  ))}
                </div>
              </div>
            ) : state.data.kind === 'operator' ? (
              <OperatorWorkspace
                data={state.data}
                scenario={state.scenario}
                setScenario={state.setScenario}
                busy={state.busy}
                preview={state.preview}
              />
            ) : (
              <CustomerWorkspace data={state.data} busy={state.busy} preview={state.preview} />
            )}
            <p className="text-center text-[10px] text-text-muted">{t('draftTranslations')}</p>
          </div>
        </main>
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface lg:hidden"
          aria-label={t('brand')}
        >
          <Link
            href="/lanka"
            className="flex min-h-11 flex-col items-center justify-center gap-1 px-4 text-[10px]"
          >
            <LayoutDashboard size={17} />
            {t('operator')}
          </Link>
          <Link
            href="/customer"
            className="flex min-h-11 flex-col items-center justify-center gap-1 px-4 text-[10px]"
          >
            <Smartphone size={17} />
            {t('customer')}
          </Link>
          <Link
            href="/overview"
            className="flex min-h-11 flex-col items-center justify-center gap-1 px-4 text-[10px]"
          >
            <Layers3 size={17} />
            {t('reference')}
          </Link>
        </nav>
      </div>
      {state.pending && (
        <ConfirmationModal close={() => state.setPending(null)}>
          <section className="w-full max-w-md rounded-card border border-border-strong bg-surface p-6 shadow-xl">
            <div className="flex justify-between gap-3">
              <h2 id="confirmation-title" className="font-display text-xl">
                {t('confirmationTitle')}
              </h2>
              <button
                onClick={() => state.setPending(null)}
                aria-label={t('cancel')}
                className="min-h-11 min-w-11"
              >
                <X size={18} />
              </button>
            </div>
            <p className="my-4 text-sm leading-relaxed text-text-secondary">
              {t('confirmationBody')}
            </p>
            <div className="rounded-control border border-border bg-canvas p-4">
              <p className="text-sm">{t(state.pending.action)}</p>
              <p className="mt-2 font-mono text-xs text-text-muted">
                DEMO-FLEX-001 · {t('version')} {state.pending.version}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                disabled={state.busy}
                onClick={() => state.setPending(null)}
                className={buttonClass}
              >
                {t('cancel')}
              </button>
              <button
                autoFocus
                disabled={state.busy}
                onClick={state.confirm}
                className={`${buttonClass} border-energy-cyan/50 bg-energy-cyan/10 text-energy-cyan`}
              >
                {t('confirm')}
              </button>
            </div>
          </section>
        </ConfirmationModal>
      )}
    </div>
  );
}

export function LankaWorkspaceClient() {
  const [locale, setLocale] = useState('en');
  const messages = locale === 'si' ? { ...en, ...si } : locale === 'ta' ? { ...en, ...ta } : en;
  return (
    <NextIntlClientProvider locale={locale} timeZone="Asia/Colombo" messages={messages}>
      <Workspace locale={locale} setLocale={setLocale} />
    </NextIntlClientProvider>
  );
}
