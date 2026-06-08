import { describe, it, expect } from 'vitest';
import { Graphics, SHAPES } from 'pixi.js-legacy';

describe('test environment: Pixi in jsdom', () => {
  it('Graphics builds graphicsData without a real renderer', () => {
    const g = new Graphics();
    g.beginFill(0xff0000).drawRect(0, 0, 10, 20).endFill();
    const data = g.geometry.graphicsData;
    expect(data).toHaveLength(1);
    expect(data[0].shape.type).toBe(SHAPES.RECT);
  });
});
