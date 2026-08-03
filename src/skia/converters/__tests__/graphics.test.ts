import { describe, it, expect } from 'vitest';
import { Graphics, SHAPES } from 'pixi.js-legacy';
import { makeMockCanvasKit, type MockPath } from '../../__tests__/mockCanvasKit';
import { extractGraphicsParts, buildPath } from '../graphics';

describe('extractGraphicsParts', () => {
  it('creates one filled Rectangle shape for drawRect (color is an RGB number)', () => {
    const g = new Graphics();
    g.beginFill('#0000ff').drawRect(-50, -75, 100, 150).endFill();
    const parts = extractGraphicsParts(g);
    expect(parts).toHaveLength(1);
    expect(parts[0]!.shape.type).toBe(SHAPES.RECT);
    expect(parts[0]!.fillStyle.visible).toBe(true);
    expect(parts[0]!.fillStyle.color).toBe(0x0000ff);
    expect(parts[0]!.lineStyle.visible).toBe(false);
  });

  it('creates an open Polygon for moveTo/lineTo with lineStyle, with visible stroke and hidden fill', () => {
    const g = new Graphics();
    g.lineStyle(10, '#ffffff', 1).moveTo(0, 0).lineTo(150, 100);
    const parts = extractGraphicsParts(g);
    expect(parts[0]!.shape.type).toBe(SHAPES.POLY);
    expect(parts[0]!.lineStyle.visible).toBe(true);
    expect(parts[0]!.lineStyle.width).toBe(10);
    expect(parts[0]!.lineStyle.color).toBe(0xffffff);
    expect(parts[0]!.fillStyle.visible).toBe(false);
  });

  it('creates multiple shapes for multiple primitives in a single Graphics object', () => {
    const g = new Graphics();
    g.beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    g.beginFill(0x00ff00).drawCircle(50, 50, 20).endFill();
    expect(extractGraphicsParts(g)).toHaveLength(2);
  });
});

describe('buildPath', () => {
  it('RECT → addRect с LTRB(x, y, x+w, y+h)', () => {
    const ck = makeMockCanvasKit();
    const g = new Graphics().beginFill(0).drawRect(-50, -75, 100, 150).endFill();
    const shape = extractGraphicsParts(g)[0]!.shape;
    const path = buildPath(ck, shape) as unknown as MockPath;
    expect(path.ops).toEqual([{ op: 'addRect', args: [['LTRB', -50, -75, 50, 75]] }]);
  });

  it('ELIP (drawEllipse hw,hh) → addOval с LTRB(x-hw, y-hh, x+hw, y+hh)', () => {
    const ck = makeMockCanvasKit();
    const g = new Graphics().beginFill(0).drawEllipse(0, 0, 200, 100).endFill();
    const shape = extractGraphicsParts(g)[0]!.shape;
    const path = buildPath(ck, shape) as unknown as MockPath;
    expect(path.ops).toEqual([{ op: 'addOval', args: [['LTRB', -200, -100, 200, 100]] }]);
  });

  it('CIRC → addOval с LTRB(x-r, y-r, x+r, y+r)', () => {
    const ck = makeMockCanvasKit();
    const g = new Graphics().beginFill(0).drawCircle(10, 20, 5).endFill();
    const shape = extractGraphicsParts(g)[0]!.shape;
    const path = buildPath(ck, shape) as unknown as MockPath;
    expect(path.ops).toEqual([{ op: 'addOval', args: [['LTRB', 5, 15, 15, 25]] }]);
  });

  it('POLY moveTo/lineTo → moveTo + lineTo, без close', () => {
    const ck = makeMockCanvasKit();
    const g = new Graphics().lineStyle(2, 0xffffff).moveTo(0, 0).lineTo(150, 100);
    const shape = extractGraphicsParts(g)[0]!.shape;
    const path = buildPath(ck, shape) as unknown as MockPath;
    expect(path.ops[0]).toEqual({ op: 'moveTo', args: [0, 0] });
    expect(path.ops[1]).toEqual({ op: 'lineTo', args: [150, 100] });
    expect(path.ops.some((o) => o.op === 'close')).toBe(false);
  });

  it('includes a close command for a closed POLY (drawPolygon)', () => {
    const ck = makeMockCanvasKit();
    const g = new Graphics().beginFill(0xff0000).drawPolygon([0, 0, 100, 0, 50, 80]).endFill();
    const shape = extractGraphicsParts(g)[0]!.shape;
    const path = buildPath(ck, shape) as unknown as MockPath;
    expect(path.ops[0]).toEqual({ op: 'moveTo', args: [0, 0] });
    expect(path.ops.some((o) => o.op === 'close')).toBe(true);
  });

  it('RREC (drawRoundedRect) → addRRect с RRectXY(LTRB, r, r)', () => {
    const ck = makeMockCanvasKit();
    const g = new Graphics().beginFill(0).drawRoundedRect(0, 0, 100, 50, 10).endFill();
    const shape = extractGraphicsParts(g)[0]!.shape;
    const path = buildPath(ck, shape) as unknown as MockPath;
    expect(path.ops).toEqual([
      { op: 'addRRect', args: [['RRectXY', ['LTRB', 0, 0, 100, 50], 10, 10]] },
    ]);
  });
});
