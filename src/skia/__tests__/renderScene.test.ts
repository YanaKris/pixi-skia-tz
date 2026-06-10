import { describe, it, expect } from 'vitest';
import { Container, Graphics, Sprite, Texture } from 'pixi.js-legacy';
import type { Canvas } from 'canvaskit-wasm';
import {
  makeMockCanvasKit,
  makeRecordingCanvas,
  makeMockImage,
  type MockPaint,
  type MockPath,
} from './mockCanvasKit';
import { renderSceneToSkCanvas } from '../renderScene';
import { SpriteImageCache } from '../converters/sprite';

describe('renderSceneToSkCanvas', () => {
  it('for a visible leaf: save → concat(worldMatrix) → drawPath → restore', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    g.position.set(20, 30);
    root.addChild(g);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);

    expect(canvas.ops).toContain('save');
    expect(canvas.ops).toContain('restore');
    expect(canvas.ops).toContain('drawPath');
    const concat = canvas.calls.find((c) => c.op === 'concat');
    expect(concat?.args[0]).toEqual([1, 0, 20, 0, 1, 30, 0, 0, 1]);
    // баланс save/restore
    expect(canvas.ops.filter((o) => o === 'save')).toHaveLength(1);
    expect(canvas.ops.filter((o) => o === 'restore')).toHaveLength(1);
  });

  it('skips invisible nodes (visible = false)', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    g.visible = false;
    root.addChild(g);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    expect(canvas.ops).not.toContain('drawPath');
  });

  it('skips nodes with worldAlpha = 0', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    root.alpha = 0;
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    root.addChild(g);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    expect(canvas.ops).not.toContain('drawPath');
  });

  it('applies the composite worldTransform of a nested subContainer', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    const sub = new Container();
    sub.position.set(75, 50);
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    g.position.set(10, 0);
    sub.addChild(g);
    root.addChild(sub);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    const concat = canvas.calls.find((c) => c.op === 'concat');
    // tx = 75 + 10 = 85, ty = 50
    expect(concat?.args[0]).toEqual([1, 0, 85, 0, 1, 50, 0, 0, 1]);
  });

  it('transfers worldAlpha to Paint alpha', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    root.alpha = 0.5;
    const g = new Graphics().beginFill(0xff0000, 1).drawRect(0, 0, 10, 10).endFill();
    root.addChild(g);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    const draw = canvas.calls.find((c) => c.op === 'drawPath');
    const paint = draw?.args[1] as unknown as MockPaint;
    expect(paint.color?.[3]).toBeCloseTo(0.5, 6); // fillAlpha(1) * worldAlpha(0.5)
  });

  it('renders both fill and stroke using two drawPath calls for a shape with fill and line', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    const g = new Graphics();
    g.beginFill(0xff0000).lineStyle(2, 0x00ff00).drawRect(0, 0, 10, 10).endFill();
    root.addChild(g);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    expect(canvas.ops.filter((o) => o === 'drawPath').length).toBeGreaterThanOrEqual(2);
  });

  it('releases Skia resources: calls .delete() on Path and Paint', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    root.addChild(g);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    const draw = canvas.calls.find((c) => c.op === 'drawPath');
    const path = draw?.args[0] as unknown as MockPath;
    const paint = draw?.args[1] as unknown as MockPaint;
    expect(path.deleted).toBe(true);
    expect(paint.deleted).toBe(true);
  });

  it('renders a Sprite via spriteCache (drawImageRect)', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    const sprite = new Sprite(Texture.WHITE);
    root.addChild(sprite);
    const cache = new SpriteImageCache();
    cache.set(sprite.texture.baseTexture.uid, makeMockImage() as never);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root, cache);
    expect(canvas.ops).toContain('drawImageRect');
  });

  it('skips Sprite rendering when spriteCache is not provided (no drawImageRect)', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    root.addChild(new Sprite(Texture.WHITE));

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    expect(canvas.ops).not.toContain('drawImageRect');
  });

  it('multiplies worldAlpha through the hierarchy: root(0.5) → sub(0.5) → g = 0.25', () => {
    const ck = makeMockCanvasKit();
    const canvas = makeRecordingCanvas();
    const root = new Container();
    root.alpha = 0.5;
    const sub = new Container();
    sub.alpha = 0.5;
    const g = new Graphics().beginFill(0xff0000, 1).drawRect(0, 0, 10, 10).endFill();
    sub.addChild(g);
    root.addChild(sub);

    renderSceneToSkCanvas(ck, canvas as unknown as Canvas, root);
    const draw = canvas.calls.find((c) => c.op === 'drawPath');
    const paint = draw?.args[1] as unknown as MockPaint;
    expect(paint.color?.[3]).toBeCloseTo(0.25, 6);
  });
});
