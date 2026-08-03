import { describe, it, expect, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { Container, Graphics } from 'pixi.js-legacy';
import {
  makeMockCanvasKit,
  makeRecordingCanvas,
  type RecordingCanvas,
} from '../../skia/__tests__/mockCanvasKit';
import { PdfExporter } from '../PdfExporter';

function makePdfCk(): {
  ck: ReturnType<typeof makeMockCanvasKit>;
  page: RecordingCanvas;
  doc: {
    beginPage: ReturnType<typeof vi.fn>;
    endPage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    bytes: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
} {
  const ck = makeMockCanvasKit();
  const page = makeRecordingCanvas();
  const doc = {
    beginPage: vi.fn(() => page),
    endPage: vi.fn(),
    close: vi.fn(),
    bytes: vi.fn(() => new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), // "%PDF-"
    delete: vi.fn(),
  };
  (ck as unknown as Record<string, unknown>).MakePDFDocument = vi.fn(() => doc);
  return { ck, page, doc };
}

describe('PdfExporter (unit, mocked PDF backend)', () => {
  it('export: beginPage(size) → render scene into page → endPage → close → bytes', () => {
    const { ck, page, doc } = makePdfCk();

    const root = new Container();
    root.addChild(new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill());

    const bytes = new PdfExporter(ck).export(root, {
      width: 200,
      height: 150,
    });

    expect(doc.beginPage).toHaveBeenCalledWith(200, 150);
    expect(page.ops).toContain('drawPath');
    expect(doc.endPage).toHaveBeenCalledTimes(1);
    expect(doc.close).toHaveBeenCalledTimes(1);
    expect(bytes[0]).toBe(0x25); // '%'
    expect(new TextDecoder().decode(bytes)).toBe('%PDF-');
    expect(doc.delete).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when CanvasKit has no PDF backend', () => {
    const ck = makeMockCanvasKit();
    expect(() => new PdfExporter(ck).export(new Container(), { width: 1, height: 1 })).toThrow(
      /PDF backend/,
    );
  });
});

const wasmJs = new URL('../../../wasm/canvaskit.js', import.meta.url);
const hasCustomWasm = existsSync(wasmJs);

describe.skipIf(!hasCustomWasm)(
  'PdfExporter (integration, custom CanvasKit with PDF support)',
  () => {
    it('produces a valid PDF (%PDF- signature) with vector operators', async () => {
      const mod = (await import(/* @vite-ignore */ wasmJs.href)) as {
        default: (opts: { locateFile: (f: string) => string }) => Promise<unknown>;
      };

      const ck = (await mod.default({
        locateFile: (f: string) => `${process.cwd()}/wasm/${f}`,
      })) as ConstructorParameters<typeof PdfExporter>[0];

      const root = new Container();
      root.addChild(new Graphics().beginFill(0xff0000).drawRect(20, 20, 100, 60).endFill());

      const bytes = new PdfExporter(ck).export(root, {
        width: 200,
        height: 150,
      });

      expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');

      const text = new TextDecoder('latin1').decode(bytes);

      expect(text).toMatch(/\/(Page|MediaBox)\b/);
      expect(text).not.toMatch(/\/Subtype\s*\/Image/);
    });
  },
);
