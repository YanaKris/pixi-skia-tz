import { describe, it, expect } from 'vitest';
import { makeMockCanvasKit, type MockPaint } from '../../__tests__/mockCanvasKit';
import { buildFillPaint, buildStrokePaint } from '../style';

describe('buildFillPaint', () => {
  it('configures Fill style, color with worldAlpha applied, and antiAlias', () => {
    const ck = makeMockCanvasKit();
    const paint = buildFillPaint(ck, { color: 0xff0000, alpha: 0.8 }, 0.5) as unknown as MockPaint;
    expect(paint.style).toBe(ck.PaintStyle.Fill);
    expect(paint.color).toEqual([1, 0, 0, 0.4]); // 0.8 * 0.5
    expect(paint.antiAlias).toBe(true);
  });

  it('clamps the alpha * worldAlpha product to a maximum of 1', () => {
    const ck = makeMockCanvasKit();
    const paint = buildFillPaint(ck, { color: 0xffffff, alpha: 1 }, 2) as unknown as MockPaint;
    expect(paint.color?.[3]).toBe(1); // 1 * 2 → зажато в 1
  });
});

describe('buildStrokePaint', () => {
  it('transfers stroke width, cap=round, and join=miter', () => {
    const ck = makeMockCanvasKit();
    const paint = buildStrokePaint(
      ck,
      { color: 0xffffff, alpha: 1, width: 10, cap: 'round', join: 'miter' },
      1,
    ) as unknown as MockPaint;
    expect(paint.style).toBe(ck.PaintStyle.Stroke);
    expect(paint.strokeWidth).toBe(10);
    expect(paint.strokeCap).toBe(ck.StrokeCap.Round);
    expect(paint.strokeJoin).toBe(ck.StrokeJoin.Miter);
    expect(paint.color).toEqual([1, 1, 1, 1]);
  });

  it('default values cap=Butt, join=Miter', () => {
    const ck = makeMockCanvasKit();
    const paint = buildStrokePaint(
      ck,
      { color: 0x000000, alpha: 1, width: 2 },
      1,
    ) as unknown as MockPaint;
    expect(paint.strokeCap).toBe(ck.StrokeCap.Butt);
    expect(paint.strokeJoin).toBe(ck.StrokeJoin.Miter);
  });

  it('join=round', () => {
    const ck = makeMockCanvasKit();
    const paint = buildStrokePaint(
      ck,
      { color: 0x000000, alpha: 1, width: 1, join: 'round' },
      1,
    ) as unknown as MockPaint;
    expect(paint.strokeJoin).toBe(ck.StrokeJoin.Round);
  });

  it('cap=square, join=bevel', () => {
    const ck = makeMockCanvasKit();
    const paint = buildStrokePaint(
      ck,
      { color: 0x102030, alpha: 0.5, width: 4, cap: 'square', join: 'bevel' },
      0.5,
    ) as unknown as MockPaint;
    expect(paint.strokeCap).toBe(ck.StrokeCap.Square);
    expect(paint.strokeJoin).toBe(ck.StrokeJoin.Bevel);
    expect(paint.color?.[3]).toBeCloseTo(0.25, 6); // 0.5 * 0.5
  });
});
