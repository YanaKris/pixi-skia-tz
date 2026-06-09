import type { CanvasKit, Paint, StrokeCap, StrokeJoin } from 'canvaskit-wasm';
import { toRgba01 } from './color';

export interface FillStyleLike {
  color: number;
  alpha: number;
}

export interface LineStyleLike {
  color: number;
  alpha: number;
  width: number;
  cap?: string;
  join?: string;
}

function resolveCap(ck: CanvasKit, cap?: string): StrokeCap {
  if (cap === 'round') return ck.StrokeCap.Round;
  if (cap === 'square') return ck.StrokeCap.Square;
  return ck.StrokeCap.Butt;
}

function resolveJoin(ck: CanvasKit, join?: string): StrokeJoin {
  if (join === 'round') return ck.StrokeJoin.Round;
  if (join === 'bevel') return ck.StrokeJoin.Bevel;
  return ck.StrokeJoin.Miter;
}

export function buildFillPaint(ck: CanvasKit, fill: FillStyleLike, worldAlpha: number): Paint {
  const p = new ck.Paint();
  p.setStyle(ck.PaintStyle.Fill);
  p.setColor(ck.Color4f(...toRgba01(fill.color, fill.alpha * worldAlpha)));
  p.setAntiAlias(true);
  return p;
}

export function buildStrokePaint(ck: CanvasKit, line: LineStyleLike, worldAlpha: number): Paint {
  const p = new ck.Paint();
  p.setStyle(ck.PaintStyle.Stroke);
  p.setColor(ck.Color4f(...toRgba01(line.color, line.alpha * worldAlpha)));
  p.setStrokeWidth(line.width);
  p.setStrokeCap(resolveCap(ck, line.cap));
  p.setStrokeJoin(resolveJoin(ck, line.join));
  p.setAntiAlias(true);
  return p;
}
