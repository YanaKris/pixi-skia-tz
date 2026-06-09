import { describe, it, expect } from 'vitest';
import { Matrix } from 'pixi.js-legacy';
import { toSkMatrix } from '../matrix';

describe('toSkMatrix', () => {
  it('Pixi {a,b,c,d,tx,ty} → row-major Skia 3×3 [a,c,tx, b,d,ty, 0,0,1]', () => {
    const m = { a: 1, b: 2, c: 3, d: 4, tx: 5, ty: 6 };
    expect(toSkMatrix(m)).toEqual([1, 3, 5, 2, 4, 6, 0, 0, 1]);
  });

  it('returns the identity matrix', () => {
    const m = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    expect(toSkMatrix(m)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it('is compatible with a real PIXI.Matrix (translate + scale)', () => {
    const m = new Matrix().scale(2, 3).translate(10, 20);
    expect(toSkMatrix(m)).toEqual([2, 0, 10, 0, 3, 20, 0, 0, 1]);
  });

  it('composition rotate∘scale via real Pixi API: fields do not leak into wrong positions', () => {
    const m = new Matrix().scale(2, 4).rotate(Math.PI / 2);
    const sk = toSkMatrix(m);
    expect(sk[0]).toBeCloseTo(m.a, 6);
    expect(sk[1]).toBeCloseTo(m.c, 6);
    expect(sk[2]).toBeCloseTo(m.tx, 6);
    expect(sk[3]).toBeCloseTo(m.b, 6);
    expect(sk[4]).toBeCloseTo(m.d, 6);
    expect(sk[5]).toBeCloseTo(m.ty, 6);
    expect(sk.slice(6)).toEqual([0, 0, 1]);
  });

  it('returns exactly 9 elements', () => {
    expect(toSkMatrix({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 })).toHaveLength(9);
  });

  it('composition rotate∘scale via real Pixi API: fields do not leak into wrong positions', () => {
    const m = new Matrix().scale(2, 4).rotate(Math.PI / 2);
    const sk = toSkMatrix(m);
    expect(sk[0]).toBeCloseTo(m.a, 6);
    expect(sk[1]).toBeCloseTo(m.c, 6);
    expect(sk[2]).toBeCloseTo(m.tx, 6);
    expect(sk[3]).toBeCloseTo(m.b, 6);
    expect(sk[4]).toBeCloseTo(m.d, 6);
    expect(sk[5]).toBeCloseTo(m.ty, 6);
    expect(sk.slice(6)).toEqual([0, 0, 1]);
  });

  it('transfers rotation: Pixi rotate(90°) → correct b and c values', () => {
    const m = new Matrix();
    m.rotate(Math.PI / 2);
    const sk = toSkMatrix(m);
    expect(sk[0]).toBeCloseTo(0, 6); // a
    expect(sk[1]).toBeCloseTo(-1, 6); // c
    expect(sk[3]).toBeCloseTo(1, 6); // b
    expect(sk[4]).toBeCloseTo(0, 6); // d
  });
});
