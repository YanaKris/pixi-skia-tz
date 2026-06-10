import CanvasKitInit from 'canvaskit-wasm';
import type { CanvasKit } from 'canvaskit-wasm';

let cached: Promise<CanvasKit> | null = null;

export function loadTestCanvasKit(): Promise<CanvasKit> {
  if (!cached) {
    cached = CanvasKitInit({
      locateFile: (file: string) => `${process.cwd()}/node_modules/canvaskit-wasm/bin/${file}`,
    });
  }
  return cached;
}
