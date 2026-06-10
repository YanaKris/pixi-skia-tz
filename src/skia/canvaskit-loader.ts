import type { CanvasKit } from 'canvaskit-wasm';

export type CanvasKitInitFn = (opts: {
  locateFile: (file: string) => string;
}) => Promise<CanvasKit>;

let cached: Promise<CanvasKit> | null = null;

export function loadCanvasKit(init: CanvasKitInitFn): Promise<CanvasKit> {
  if (!cached) {
    cached = init({ locateFile: (file) => `/${file}` }).catch((err: unknown) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}

export function __resetForTests(): void {
  cached = null;
}
