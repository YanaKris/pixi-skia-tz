import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CanvasKit } from 'canvaskit-wasm';
import { loadCanvasKit, __resetForTests } from '../canvaskit-loader';

beforeEach(() => {
  __resetForTests();
});

describe('loadCanvasKit', () => {
  it('calls init only once and caches the instance', async () => {
    const fake = { tag: 'ck' } as unknown as CanvasKit;
    const init = vi.fn().mockResolvedValue(fake);
    const a = await loadCanvasKit(init);
    const b = await loadCanvasKit(init);
    expect(a).toBe(fake);
    expect(b).toBe(fake);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('passes locateFile that resolves file names from the site root', async () => {
    const init = vi.fn().mockResolvedValue({} as CanvasKit);
    await loadCanvasKit(init);
    const opts = init.mock.calls[0]![0] as { locateFile: (f: string) => string };
    expect(opts.locateFile('canvaskit.wasm')).toBe('/canvaskit.wasm');
  });

  it('returns the same promise on subsequent calls (without reinitialization)', async () => {
    const init = vi.fn().mockResolvedValue({} as CanvasKit);
    const p1 = loadCanvasKit(init);
    const p2 = loadCanvasKit(init);
    expect(p1).toBe(p2);
    await p1;
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('returns the same promise on subsequent calls (without reinitialization)', async () => {
    const init = vi.fn().mockResolvedValue({} as CanvasKit);
    await loadCanvasKit(init);
    __resetForTests();
    await loadCanvasKit(init);
    expect(init).toHaveBeenCalledTimes(2);
  });

  it('allows retry after init failure (rejected promise is not cached)', async () => {
    const fake = { tag: 'ck' } as unknown as CanvasKit;
    const init = vi
      .fn()
      .mockRejectedValueOnce(new Error('wasm load failed'))
      .mockResolvedValueOnce(fake);

    await expect(loadCanvasKit(init)).rejects.toThrow('wasm load failed');
    const ck = await loadCanvasKit(init);
    expect(ck).toBe(fake);
    expect(init).toHaveBeenCalledTimes(2);
  });
});
