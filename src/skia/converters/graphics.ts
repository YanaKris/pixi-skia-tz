import { Graphics, SHAPES } from 'pixi.js-legacy';
import type { CanvasKit, Path } from 'canvaskit-wasm';

export interface ShapeLike {
  type: SHAPES;
  [key: string]: unknown;
}

export interface GraphicsPart {
  shape: ShapeLike;
  fillStyle: { visible: boolean; color: number; alpha: number };
  lineStyle: {
    visible: boolean;
    color: number;
    alpha: number;
    width: number;
    cap?: string;
    join?: string;
  };
}

export function extractGraphicsParts(g: Graphics): GraphicsPart[] {
  g.finishPoly();
  return g.geometry.graphicsData.map((d) => ({
    shape: d.shape as unknown as ShapeLike,
    fillStyle: {
      visible: d.fillStyle.visible,
      color: d.fillStyle.color,
      alpha: d.fillStyle.alpha,
    },
    lineStyle: {
      visible: d.lineStyle.visible,
      color: d.lineStyle.color,
      alpha: d.lineStyle.alpha,
      width: d.lineStyle.width,
      cap: d.lineStyle.cap,
      join: d.lineStyle.join,
    },
  }));
}

export function buildPath(ck: CanvasKit, shape: ShapeLike): Path {
  const path = new ck.Path();
  const s = shape as Record<string, number> & {
    type: SHAPES;
    points?: number[];
    closeStroke?: boolean;
  };

  switch (shape.type) {
    case SHAPES.RECT:
      path.addRect(ck.LTRBRect(s.x, s.y, s.x + s.width, s.y + s.height));
      break;
    case SHAPES.CIRC:
      path.addOval(ck.LTRBRect(s.x - s.radius, s.y - s.radius, s.x + s.radius, s.y + s.radius));
      break;
    case SHAPES.ELIP:
      path.addOval(ck.LTRBRect(s.x - s.width, s.y - s.height, s.x + s.width, s.y + s.height));
      break;
    case SHAPES.RREC:
      path.addRRect(
        ck.RRectXY(ck.LTRBRect(s.x, s.y, s.x + s.width, s.y + s.height), s.radius, s.radius),
      );
      break;
    case SHAPES.POLY: {
      const pts = (shape as { points?: number[] }).points ?? [];
      if (pts.length >= 2) {
        path.moveTo(pts[0]!, pts[1]!);
        for (let i = 2; i + 1 < pts.length; i += 2) {
          path.lineTo(pts[i]!, pts[i + 1]!);
        }
        if ((shape as { closeStroke?: boolean }).closeStroke) path.close();
      }
      break;
    }
  }
  return path;
}
