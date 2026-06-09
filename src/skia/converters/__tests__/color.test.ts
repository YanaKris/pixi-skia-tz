import { describe, it, expect } from 'vitest';
import { toRgba01 } from '../color';

describe('toRgba01', () => {
  it('converts red 0xff0000 with alpha 1 to [1, 0, 0, 1]', () => {
    expect(toRgba01(0xff0000, 1)).toEqual([1, 0, 0, 1]);
  });

  it('converts blue 0x0000ff with alpha 0.5 to [0, 0, 1, 0.5]', () => {
    expect(toRgba01(0x0000ff, 0.5)).toEqual([0, 0, 1, 0.5]);
  });

  it('converts green 0x00ff00 to [0, 1, 0, 1]', () => {
    expect(toRgba01(0x00ff00, 1)).toEqual([0, 1, 0, 1]);
  });

  it('converts white 0xffffff to [1, 1, 1, 1]', () => {
    expect(toRgba01(0xffffff, 1)).toEqual([1, 1, 1, 1]);
  });

  it('clamps alpha to a maximum of 1', () => {
    expect(toRgba01(0xffffff, 2)[3]).toBe(1);
  });

  it('clamps alpha to a minimum of 0', () => {
    expect(toRgba01(0x000000, -0.5)[3]).toBe(0);
  });

  it('converts mixed color 0x8040c0 to correct 0..1 components', () => {
    const [r, g, b] = toRgba01(0x8040c0, 1);
    expect(r).toBeCloseTo(0x80 / 255, 6);
    expect(g).toBeCloseTo(0x40 / 255, 6);
    expect(b).toBeCloseTo(0xc0 / 255, 6);
  });
});