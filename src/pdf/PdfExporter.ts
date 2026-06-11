import type { CanvasKit, Canvas } from 'canvaskit-wasm';
import { Container } from 'pixi.js-legacy';
import { renderSceneToSkCanvas } from '../skia/renderScene';
import type { SpriteImageCache } from '../skia/converters/sprite';

interface PdfDocument {
  beginPage(width: number, height: number): Canvas;
  endPage(): void;
  close(): void;
  bytes(): Uint8Array;
  delete?(): void;
}

interface PdfCapableCanvasKit extends CanvasKit {
  MakePDFDocument?(title: string): PdfDocument;
}

export interface PageSize {
  width: number;
  height: number;
}

export class PdfExporter {
  private readonly ck: CanvasKit;

  constructor(ck: CanvasKit) {
    this.ck = ck;
  }

  export(root: Container, size: PageSize, spriteCache?: SpriteImageCache): Uint8Array {
    const ck = this.ck as PdfCapableCanvasKit;
    if (typeof ck.MakePDFDocument !== 'function') {
      throw new Error(
        'CanvasKit без PDF backend — соберите кастомный CanvasKit (см. build-skia/) и положите в wasm/',
      );
    }

    const doc = ck.MakePDFDocument('scene');
    try {
      const page = doc.beginPage(size.width, size.height);
      renderSceneToSkCanvas(this.ck, page, root, spriteCache);
      doc.endPage();
      doc.close();
      return new Uint8Array(doc.bytes());
    } finally {
      doc.delete?.();
    }
  }
}
