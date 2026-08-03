import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Sprite } from 'pixi.js-legacy';
import {
  makeMockCanvasKit,
  makeRecordingCanvas,
  makeMockImage,
  type MockImage,
} from '../../__tests__/mockCanvasKit';
import { SpriteImageCache, drawSprite } from '../sprite';

function fakeFetch(byteLength: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(byteLength),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SpriteImageCache', () => {
  beforeEach(() => fakeFetch(16));

  it('loadFromUrl decodes an image once and caches it by uid', async () => {
    const ck = makeMockCanvasKit();
    const spy = vi.spyOn(ck, 'MakeImageFromEncoded');
    const cache = new SpriteImageCache();

    expect(await cache.loadFromUrl(ck, 1, 'a.png')).toBe(true);
    expect(cache.has(1)).toBe(true);

    await cache.loadFromUrl(ck, 1, 'a.png');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('loadFromUrl returns false when image decoding fails (empty bytes)', async () => {
    fakeFetch(0);

    const ck = makeMockCanvasKit();
    const cache = new SpriteImageCache();

    expect(await cache.loadFromUrl(ck, 2, 'broken.png')).toBe(false);
    expect(cache.has(2)).toBe(false);
  });

  it('loadFromUrl returns false on network error without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const ck = makeMockCanvasKit();
    const cache = new SpriteImageCache();

    await expect(cache.loadFromUrl(ck, 7, 'x.png')).resolves.toBe(false);
    expect(cache.has(7)).toBe(false);
  });

  it('parallel loadFromUrl calls for the same uid do not duplicate decoding', async () => {
    const ck = makeMockCanvasKit();
    const spy = vi.spyOn(ck, 'MakeImageFromEncoded');
    const cache = new SpriteImageCache();

    await Promise.all([cache.loadFromUrl(ck, 8, 'a.png'), cache.loadFromUrl(ck, 8, 'a.png')]);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('dispose releases all images and clears the cache', async () => {
    const ck = makeMockCanvasKit();
    const cache = new SpriteImageCache();

    await cache.loadFromUrl(ck, 3, 'a.png');

    const img = cache.get(3) as unknown as MockImage;

    cache.dispose();

    expect(img.deleted).toBe(true);
    expect(cache.has(3)).toBe(false);
  });
});

describe('drawSprite', () => {
  function makeSpriteLike(
    uid: number,
    fx: number,
    fy: number,
    w: number,
    h: number,
    ax: number,
    ay: number,
  ): Sprite {
    return {
      texture: {
        baseTexture: { uid },
        frame: { x: fx, y: fy, width: w, height: h },
        orig: { width: w, height: h },
      },
      anchor: { x: ax, y: ay },
      worldTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    } as unknown as Sprite;
  }

  it('full-frame texture: src covers the whole frame and dst is centered for anchor 0.5', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const cache = new SpriteImageCache();

    const sprite = makeSpriteLike(1, 0, 0, 100, 50, 0.5, 0.5);

    cache.set(1, makeMockImage() as never);

    drawSprite(ck, canvas as never, sprite, cache);

    const call = canvas.calls.find((c) => c.op === 'drawImageRect');

    expect(call?.args[1]).toEqual(['LTRB', 0, 0, 100, 50]);
    expect(call?.args[2]).toEqual(['LTRB', -50, -25, 50, 25]);
  });

  it('atlas/trim: src crops texture.frame from the base texture', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const cache = new SpriteImageCache();

    const sprite = makeSpriteLike(5, 20, 30, 40, 25, 0, 0);

    cache.set(5, makeMockImage() as never);

    drawSprite(ck, canvas as never, sprite, cache);

    const call = canvas.calls.find((c) => c.op === 'drawImageRect');

    expect(call?.args[1]).toEqual(['LTRB', 20, 30, 60, 55]);
    expect(call?.args[2]).toEqual(['LTRB', 0, 0, 40, 25]);
  });

  it('skips sprite rendering when image is missing from cache', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const cache = new SpriteImageCache();

    drawSprite(ck, canvas as never, makeSpriteLike(9, 0, 0, 10, 10, 0, 0), cache);

    expect(canvas.ops).not.toContain('drawImageRect');
  });
});
