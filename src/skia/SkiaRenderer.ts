import type { CanvasKit, Surface } from 'canvaskit-wasm';
import { Container } from 'pixi.js-legacy';
import { renderSceneToSkCanvas } from './renderScene';

export class SkiaRenderer {
  private readonly ck: CanvasKit;
  private readonly surface: Surface;

  constructor(ck: CanvasKit, surface: Surface) {
    this.ck = ck;
    this.surface = surface;
  }

  render(root: Container): void {
    const canvas = this.surface.getCanvas();
    canvas.clear(this.ck.TRANSPARENT);
    renderSceneToSkCanvas(this.ck, canvas, root);
    this.surface.flush();
  }

  dispose(): void {
    this.surface.delete();
  }
}

export function createOnscreenRenderer(ck: CanvasKit, canvasEl: HTMLCanvasElement): SkiaRenderer {
  const surface = ck.MakeWebGLCanvasSurface(canvasEl) ?? ck.MakeSWCanvasSurface(canvasEl);
  if (!surface) {
    throw new Error('Не удалось создать Skia-поверхность для переданного <canvas>');
  }
  return new SkiaRenderer(ck, surface);
}
