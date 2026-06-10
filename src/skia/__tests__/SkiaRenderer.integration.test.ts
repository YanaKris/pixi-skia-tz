import { describe, it, expect } from 'vitest';
import { Container, Graphics } from 'pixi.js-legacy';
import { loadTestCanvasKit } from './loadTestCanvasKit';
import { SkiaRenderer } from '../SkiaRenderer';

describe('SkiaRenderer (интеграция, реальный CanvasKit)', () => {
  it('рендерит сцену с трансформациями и отдаёт непустой PNG-снимок', async () => {
    const ck = await loadTestCanvasKit();
    const surface = ck.MakeSurface(200, 150)!;
    expect(surface).toBeTruthy();
    const renderer = new SkiaRenderer(ck, surface);

    const root = new Container();
    const sub = new Container();
    sub.position.set(40, 30);
    const g1 = new Graphics().beginFill(0xff0000).drawEllipse(0, 0, 30, 20).endFill();
    g1.position.set(50, 40);
    g1.angle = 30;
    const g2 = new Graphics().lineStyle(4, 0xffffff, 1).moveTo(0, 0).lineTo(60, 40);
    g2.angle = -15;
    sub.addChild(g2);
    root.addChild(sub, g1);

    renderer.render(root);
    const snapshot = surface.makeImageSnapshot();
    expect(snapshot).toBeTruthy();
    const png = snapshot!.encodeToBytes();
    expect(png && png.length).toBeGreaterThan(0);

    snapshot!.delete();
    surface.delete();
  });

    it('renders pixels correctly: inside the shape is opaque, outside is transparent', async () => {
    const ck = await loadTestCanvasKit();
    const surface = ck.MakeSurface(100, 100)!;
    const renderer = new SkiaRenderer(ck, surface);
    const root = new Container();
    root.addChild(new Graphics().beginFill(0xff0000, 1).drawRect(10, 10, 80, 80).endFill());
    renderer.render(root);

    const info = {
      width: 1,
      height: 1,
      colorType: ck.ColorType.RGBA_8888,
      alphaType: ck.AlphaType.Unpremul,
      colorSpace: ck.ColorSpace.SRGB,
    };
    const canvas = surface.getCanvas();
    const inside = canvas.readPixels(50, 50, info) as Uint8Array;
    expect(inside[3]).toBeGreaterThan(0);
    expect(inside[0]).toBeGreaterThan(0);
    const outside = canvas.readPixels(2, 2, info) as Uint8Array;
    expect(outside[3]).toBe(0);

    surface.delete();
  });

  it('повторный render не падает и не течёт (idempotent)', async () => {
    const ck = await loadTestCanvasKit();
    const surface = ck.MakeSurface(100, 100)!;
    const renderer = new SkiaRenderer(ck, surface);
    const root = new Container();
    root.addChild(new Graphics().beginFill(0x0000ff).drawRect(10, 10, 40, 40).endFill());

    expect(() => {
      renderer.render(root);
      renderer.render(root);
      renderer.render(root);
    }).not.toThrow();

    surface.delete();
  });
});
