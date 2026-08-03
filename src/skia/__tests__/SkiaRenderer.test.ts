import { describe, it, expect, vi, afterEach } from 'vitest';
import { Container, Graphics, Sprite, Texture } from 'pixi.js-legacy';
import type { Surface } from 'canvaskit-wasm';
import { makeMockCanvasKit, makeRecordingCanvas, makeMockSurface } from './mockCanvasKit';
import { SkiaRenderer, createOnscreenRenderer } from '../SkiaRenderer';

afterEach(() => vi.unstubAllGlobals());

describe('SkiaRenderer (unit, мок surface)', () => {
  it('render: очищает канвас, рисует сцену и делает flush', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const surface = makeMockSurface(canvas);
    const renderer = new SkiaRenderer(ck, surface as unknown as Surface);

    const root = new Container();
    root.addChild(new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill());
    renderer.render(root);

    expect(canvas.ops).toContain('clear');
    expect(canvas.ops).toContain('drawPath');
    expect(canvas.ops.indexOf('clear')).toBeLessThan(canvas.ops.indexOf('drawPath'));
    expect(surface.flushed).toBe(true);
  });

  it('dispose освобождает surface', () => {
    const ck = makeMockCanvasKit();
    const surface = makeMockSurface(makeRecordingCanvas());
    const renderer = new SkiaRenderer(ck, surface as unknown as Surface);
    renderer.dispose();
    expect(surface.deleted).toBe(true);
  });

  it('повторный render очищает канвас заново (без накопления)', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const surface = makeMockSurface(canvas);
    const renderer = new SkiaRenderer(ck, surface as unknown as Surface);
    const root = new Container();
    root.addChild(new Graphics().beginFill(0x00ff00).drawRect(0, 0, 5, 5).endFill());

    renderer.render(root);
    renderer.render(root);
    expect(canvas.ops.filter((o) => o === 'clear')).toHaveLength(2);
  });

  it('loadSprite + render рисует спрайт из внутреннего кеша', async () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const surface = makeMockSurface(canvas);
    const renderer = new SkiaRenderer(ck, surface as unknown as Surface);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ arrayBuffer: async () => new ArrayBuffer(16) }),
    );
    const sprite = new Sprite(Texture.WHITE);
    await renderer.loadSprite(sprite.texture.baseTexture.uid, 'a.png');

    const root = new Container();
    root.addChild(sprite);
    renderer.render(root);
    expect(canvas.ops).toContain('drawImageRect');
  });
});

describe('createOnscreenRenderer', () => {
  it('использует WebGL-поверхность, если доступна', () => {
    const ck = makeMockCanvasKit();
    const surface = makeMockSurface(makeRecordingCanvas());
    (ck as unknown as Record<string, unknown>).MakeWebGLCanvasSurface = () => surface;
    (ck as unknown as Record<string, unknown>).MakeSWCanvasSurface = () => null;
    const r = createOnscreenRenderer(ck, document.createElement('canvas'));
    expect(r).toBeInstanceOf(SkiaRenderer);
  });

  it('падает обратно на software-поверхность, если WebGL недоступен', () => {
    const ck = makeMockCanvasKit();
    const surface = makeMockSurface(makeRecordingCanvas());
    (ck as unknown as Record<string, unknown>).MakeWebGLCanvasSurface = () => null;
    (ck as unknown as Record<string, unknown>).MakeSWCanvasSurface = () => surface;
    const r = createOnscreenRenderer(ck, document.createElement('canvas'));
    expect(r).toBeInstanceOf(SkiaRenderer);
  });

  it('бросает, если поверхность создать не удалось', () => {
    const ck = makeMockCanvasKit();
    (ck as unknown as Record<string, unknown>).MakeWebGLCanvasSurface = () => null;
    (ck as unknown as Record<string, unknown>).MakeSWCanvasSurface = () => null;
    expect(() => createOnscreenRenderer(ck, document.createElement('canvas'))).toThrow();
  });
});
