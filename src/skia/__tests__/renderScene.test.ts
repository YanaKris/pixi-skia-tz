import { describe, it, expect } from 'vitest';
import { Container, Graphics } from 'pixi.js-legacy';
import type { Canvas } from 'canvaskit-wasm';
import { makeMockCanvasKit, makeRecordingCanvas, type MockPaint } from './mockCanvasKit';
import { renderSceneToSkCanvas } from '../renderScene';

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
    expect(paint.color?.[3]).toBeCloseTo(0.5, 6);
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
});
