import type { CanvasKit, Canvas, Paint, Path } from 'canvaskit-wasm';
import { Container, Graphics, DisplayObject } from 'pixi.js-legacy';
import { toSkMatrix } from './converters/matrix';
import { extractGraphicsParts, buildPath } from './converters/graphics';
import { buildFillPaint, buildStrokePaint } from './converters/style';

const tempParent = new Container();

export function renderSceneToSkCanvas(ck: CanvasKit, canvas: Canvas, root: Container): void {
  const cachedParent = root.parent;
  root.parent = tempParent;
  root.updateTransform();
  root.parent = cachedParent;

  renderNode(ck, canvas, root);
}

function renderNode(ck: CanvasKit, canvas: Canvas, node: DisplayObject): void {
  if (!node.visible || node.worldAlpha <= 0) return;

  if (node instanceof Graphics) {
    drawGraphics(ck, canvas, node);
  }

  const children = (node as Container).children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      renderNode(ck, canvas, children[i]!);
    }
  }
}

function drawGraphics(ck: CanvasKit, canvas: Canvas, g: Graphics): void {
  const parts = extractGraphicsParts(g);
  if (parts.length === 0) return;

  canvas.save();
  canvas.concat(toSkMatrix(g.worldTransform));

  for (const part of parts) {
    const path: Path = buildPath(ck, part.shape);

    if (part.fillStyle.visible) {
      const paint: Paint = buildFillPaint(ck, part.fillStyle, g.worldAlpha);
      canvas.drawPath(path, paint);
      paint.delete();
    }
    if (part.lineStyle.visible) {
      const paint: Paint = buildStrokePaint(ck, part.lineStyle, g.worldAlpha);
      canvas.drawPath(path, paint);
      paint.delete();
    }

    path.delete();
  }

  canvas.restore();
}
