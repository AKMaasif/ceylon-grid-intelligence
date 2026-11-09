'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LankaWorkspace } from '@/server/lanka/workspace';
import type { LankaAction, Persona } from '../contracts';

export function useWorkspace() {
  const [data, setData] = useState<LankaWorkspace | null>(null);
  const [scenario, setScenario] = useState('cloudy_afternoon');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{
    action: LankaAction;
    version: number;
    confirmation: string;
  } | null>(null);
  const requestSequence = useRef(0);
  const invalidateRequests = useCallback(() => {
    requestSequence.current++;
  }, []);
  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current;
    try {
      const response = await fetch(`/api/lanka?scenario=${scenario}`, { cache: 'no-store' });
      const body = await response.json();
      if (sequence !== requestSequence.current) return;
      if (response.status === 401) {
        setData(null);
        return;
      }
      if (!response.ok) throw new Error(body.error);
      setData(body);
    } catch (cause) {
      if (sequence === requestSequence.current)
        setError(cause instanceof Error ? cause.message : 'unavailable');
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [scenario]);
  useEffect(() => {
    let active = true;
    const tick = () => {
      if (active && !document.hidden) void refresh();
    };
    const initial = setTimeout(tick, 0);
    const timer = setInterval(tick, 5000);
    window.addEventListener('focus', tick);
    return () => {
      active = false;
      clearTimeout(initial);
      clearInterval(timer);
      invalidateRequests();
      window.removeEventListener('focus', tick);
    };
  }, [refresh, invalidateRequests]);
  async function request(url: string, body: unknown) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }
  async function login(persona: Persona) {
    setBusy(true);
    setError('');
    setPending(null);
    try {
      await request('/api/lanka/session', { persona });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'unavailable');
    } finally {
      setBusy(false);
    }
  }
  async function preview(action: LankaAction) {
    if (!data) return;
    setBusy(true);
    setError('');
    try {
      const result = await request('/api/lanka', { action, version: data.event.version });
      setPending({ action, version: data.event.version, confirmation: result.confirmation });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'unavailable');
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError('');
    try {
      await request('/api/lanka', pending);
      setPending(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'unavailable');
      setPending(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/lanka/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('unavailable');
      requestSequence.current++;
      setData(null);
      setPending(null);
    } catch {
      setError('unavailable');
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    scenario,
    setScenario,
    loading,
    busy,
    error,
    pending,
    setPending,
    refresh,
    login,
    logout,
    preview,
    confirm,
  };
}
