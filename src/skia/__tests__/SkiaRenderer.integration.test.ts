import { describe, it, expect } from 'vitest';
import { Container, Graphics } from 'pixi.js-legacy';
import { loadTestCanvasKit } from './loadTestCanvasKit';
import { SkiaRenderer } from '../SkiaRenderer';

/**
 * Интеграция с РЕАЛЬНЫМ CanvasKit: проверяет, что весь pipeline (Pixi scene-graph →
 * renderSceneToSkCanvas → Skia surface) реально рисует и отдаёт растровый снимок.
 */
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
