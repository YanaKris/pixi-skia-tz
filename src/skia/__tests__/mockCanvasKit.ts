import type { CanvasKit } from 'canvaskit-wasm';

export interface MockPaint {
  style?: unknown;
  color?: number[];
  strokeWidth?: number;
  strokeCap?: unknown;
  strokeJoin?: unknown;
  antiAlias?: boolean;
  deleted: boolean;
}

export interface MockPathOp {
  op: string;
  args: unknown[];
}

export interface MockPath {
  ops: MockPathOp[];
  deleted: boolean;
}

class PaintImpl implements MockPaint {
  style?: unknown;
  color?: number[];
  strokeWidth?: number;
  strokeCap?: unknown;
  strokeJoin?: unknown;
  antiAlias?: boolean;
  deleted = false;
  setStyle(s: unknown): void {
    this.style = s;
  }
  setColor(c: number[]): void {
    this.color = c;
  }
  setStrokeWidth(w: number): void {
    this.strokeWidth = w;
  }
  setStrokeCap(c: unknown): void {
    this.strokeCap = c;
  }
  setStrokeJoin(j: unknown): void {
    this.strokeJoin = j;
  }
  setAntiAlias(b: boolean): void {
    this.antiAlias = b;
  }
  delete(): void {
    this.deleted = true;
  }
}

class PathImpl implements MockPath {
  ops: MockPathOp[] = [];
  deleted = false;
  moveTo(x: number, y: number): void {
    this.ops.push({ op: 'moveTo', args: [x, y] });
  }
  lineTo(x: number, y: number): void {
    this.ops.push({ op: 'lineTo', args: [x, y] });
  }
  addRect(rect: unknown): void {
    this.ops.push({ op: 'addRect', args: [rect] });
  }
  addOval(rect: unknown): void {
    this.ops.push({ op: 'addOval', args: [rect] });
  }
  addRRect(rrect: unknown): void {
    this.ops.push({ op: 'addRRect', args: [rrect] });
  }
  close(): void {
    this.ops.push({ op: 'close', args: [] });
  }
  delete(): void {
    this.deleted = true;
  }
}

export function makeMockCanvasKit(): CanvasKit {
  const ck = {
    Paint: PaintImpl,
    Path: PathImpl,
    PaintStyle: { Fill: { value: 0 }, Stroke: { value: 1 } },
    StrokeCap: { Butt: { value: 0 }, Round: { value: 1 }, Square: { value: 2 } },
    StrokeJoin: { Miter: { value: 0 }, Round: { value: 1 }, Bevel: { value: 2 } },
    Color4f: (r: number, g: number, b: number, a: number): number[] => [r, g, b, a],
    LTRBRect: (l: number, t: number, r: number, b: number): unknown => ['LTRB', l, t, r, b],
    RRectXY: (rect: unknown, rx: number, ry: number): unknown => ['RRectXY', rect, rx, ry],
  };
  return ck as unknown as CanvasKit;
}

/** Записывающий SkCanvas: фиксирует последовательность операций обхода (для T8). */
export interface RecordingCanvas {
  ops: string[];
  calls: MockPathOp[];
  save(): void;
  restore(): void;
  concat(m: number[]): void;
  drawPath(path: unknown, paint: unknown): void;
  drawImageRect(img: unknown, src: unknown, dst: unknown, paint: unknown): void;
}

export function makeRecordingCanvas(): RecordingCanvas {
  const ops: string[] = [];
  const calls: MockPathOp[] = [];
  const rec = (op: string, ...args: unknown[]): void => {
    ops.push(op);
    calls.push({ op, args });
  };
  return {
    ops,
    calls,
    save: () => rec('save'),
    restore: () => rec('restore'),
    concat: (m) => rec('concat', m),
    drawPath: (path, paint) => rec('drawPath', path, paint),
    drawImageRect: (img, src, dst, paint) => rec('drawImageRect', img, src, dst, paint),
  };
}
