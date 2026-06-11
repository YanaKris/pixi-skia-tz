import type { CanvasKit } from 'canvaskit-wasm';
import { mountLayout } from './ui/dom';
import { bindControls } from './ui/Controls';
import { loadCanvasKit, type CanvasKitInitFn } from './skia/canvaskit-loader';
import { createPixiStage } from './pixi/PixiStage';
import { createOnscreenRenderer } from './skia/SkiaRenderer';
import { SkiaEventBridge } from './events/SkiaEventBridge';
import { PdfExporter } from './pdf/PdfExporter';
import { buildExampleScene } from './scenes/exampleScene';
import { buildAltScene } from './scenes/altScene';
import { AppController } from './app/createApp';

const WIDTH = 800;
const HEIGHT = 600;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Не удалось загрузить ${src}`));
    document.head.appendChild(s);
  });
}

function downloadBlob(bytes: Uint8Array, filename: string, type = 'application/pdf'): void {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


async function main(): Promise<void> {
  const refs = mountLayout(document.body);

  const base = import.meta.env.BASE_URL;
  await loadScript(`${base}canvaskit.js`);
  const init = (globalThis as unknown as { CanvasKitInit?: CanvasKitInitFn }).CanvasKitInit;
  if (!init) throw new Error('CanvasKit не загружен — проверьте public/canvaskit.js');
  const ck: CanvasKit = await loadCanvasKit((opts) => init(opts));

  const pixi = createPixiStage(refs.pixiCanvas, WIDTH, HEIGHT);
  const skia = createOnscreenRenderer(ck, refs.skiaCanvas);
  const exporter = new PdfExporter(ck);

  const scenes = [buildExampleScene(), buildAltScene()];

  const requestRender = (): void => {
    pixi.app.render(); 
    skia.render(pixi.root); 
  };

  const controller = new AppController({
    stageRoot: pixi.root,
    scenes,
    requestRender,
    exportPdf: () => exporter.export(pixi.root, { width: WIDTH, height: HEIGHT }),
    download: (bytes, name) => downloadBlob(bytes, name),
  });

  pixi.app.stage.eventMode = 'static';
  new SkiaEventBridge(pixi.root, refs.skiaCanvas).attach();

  bindControls(refs, {
    onAddShape: () => controller.onAddShape(),
    onSwitchScene: () => controller.onSwitchScene(),
    onExportPdf: () => {
      try {
        controller.onExportPdf();
      } catch (err) {
        window.alert(`Экспорт в PDF недоступен: ${(err as Error).message}`);
      }
    },
  });

  requestRender();
  refs.skiaCanvas.dataset.ready = 'true';
}

void main();
