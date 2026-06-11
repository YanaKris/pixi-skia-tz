import { describe, it, expect, vi } from 'vitest';
import { SHAPES, Graphics } from 'pixi.js-legacy';
import { createRandomGraphics } from '../randomShapes';
import { extractGraphicsParts } from '../../skia/converters/graphics';

/** Детерминированный RNG: выдаёт значения из массива по кругу. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

/** Полный сериализуемый снимок фигуры (для проверки детерминизма). */
function snapshot(g: Graphics): string {
  const parts = extractGraphicsParts(g).map((p) => ({
    shape: p.shape,
    fill: p.fillStyle,
    line: p.lineStyle,
  }));
  return JSON.stringify({ parts, pos: [g.position.x, g.position.y], angle: g.angle });
}

describe('createRandomGraphics', () => {
  it('rng≈0 → прямоугольник (kind 0)', () => {
    expect(extractGraphicsParts(createRandomGraphics(seq([0])))[0]!.shape.type).toBe(SHAPES.RECT);
  });

  it('rng≈0.3 → эллипс (kind 1)', () => {
    expect(extractGraphicsParts(createRandomGraphics(seq([0.3])))[0]!.shape.type).toBe(SHAPES.ELIP);
  });

  it('rng≈0.6 → круг (kind 2)', () => {
    expect(extractGraphicsParts(createRandomGraphics(seq([0.6])))[0]!.shape.type).toBe(SHAPES.CIRC);
  });

  it('rng≈0.9 → линия (Polygon, kind 3)', () => {
    const parts = extractGraphicsParts(createRandomGraphics(seq([0.9, 0.1])));
    expect(parts[0]!.shape.type).toBe(SHAPES.POLY);
    expect(parts[0]!.lineStyle.visible).toBe(true);
  });

  it('возвращает Graphics с непустой геометрией и конечными позицией/углом', () => {
    const g = createRandomGraphics(seq([0.25]));
    expect(extractGraphicsParts(g).length).toBeGreaterThan(0);
    expect(Number.isFinite(g.position.x)).toBe(true);
    expect(Number.isFinite(g.angle)).toBe(true);
  });

  it('полностью детерминирован: одинаковый rng → идентичный снимок (геометрия+позиция+угол)', () => {
    const seqVals = [0.5, 0.2, 0.3, 0.7, 0.1, 0.9, 0.4];
    expect(snapshot(createRandomGraphics(seq(seqVals)))).toBe(
      snapshot(createRandomGraphics(seq(seqVals))),
    );
  });

  it('потребляет rng в стабильном порядке (kind влияет на тип, позиция/угол — из последних вызовов)', () => {
    // rng-спай возвращает 0.5 (kind=2, circle), затем фиксированные значения и считает вызовы
    const values = [0.5, 0, 0.5, 0.25, 0.5, 0.1];
    const calls: number[] = [];
    const rng = vi.fn(() => {
      const v = values[calls.length % values.length]!;
      calls.push(v);
      return v;
    });
    const g = createRandomGraphics(rng);
    expect(extractGraphicsParts(g)[0]!.shape.type).toBe(SHAPES.CIRC); // первый вызов → kind
    // позиция/угол берутся из последних трёх вызовов (x,y,angle)
    expect(rng.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(g.angle).toBeCloseTo(0.1 * 360, 6); // последний вызов → angle
  });

  it('по умолчанию использует Math.random (не бросает)', () => {
    expect(() => createRandomGraphics()).not.toThrow();
  });
});
