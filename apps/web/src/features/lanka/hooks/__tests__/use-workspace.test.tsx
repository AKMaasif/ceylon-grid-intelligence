import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWorkspace } from '../use-workspace';

afterEach(() => vi.unstubAllGlobals());
describe('workspace confirmation lifecycle', () => {
  it('does not submit a consequential action until the exact preview is confirmed', async () => {
    const data = { event: { version: 7 }, kind: 'operator' };
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => ({
      status: 200,
      ok: true,
      json: async () => (init?.method === 'POST' ? { confirmation: 'signed-preview' } : data),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { result, unmount } = renderHook(() => useWorkspace());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.preview('publish');
    });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(result.current.pending).toEqual({
      action: 'publish',
      version: 7,
      confirmation: 'signed-preview',
    });
    await act(async () => {
      await result.current.confirm();
    });
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(posts[1]![1]?.body))).toEqual({
      action: 'publish',
      version: 7,
      confirmation: 'signed-preview',
    });
    expect(result.current.pending).toBe(null);
    unmount();
  });
  it('exposes rejected verification rather than displaying success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => ({
        status: init ? 422 : 200,
        ok: !init,
        json: async () =>
          init ? { error: 'insufficient_data' } : { event: { version: 1 }, kind: 'operator' },
      }))
    );
    const { result, unmount } = renderHook(() => useWorkspace());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.preview('verify');
    });
    expect(result.current.error).toBe('insufficient_data');
    expect(result.current.pending).toBe(null);
    unmount();
  });
});
