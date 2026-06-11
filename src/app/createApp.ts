import { Container } from 'pixi.js-legacy';
import { SceneSwitcher } from '../scenes/sceneSwitcher';
import { createRandomGraphics, type Rng } from '../scenes/randomShapes';
import { makeInteractive } from '../events/interactions';

/** Зависимости контроллера приложения (инъецируются ради тестируемости). */
export interface AppDeps {
  /** Контейнер в stage Pixi, куда помещается активная сцена. */
  stageRoot: Container;
  /** Преднастроенные сцены для переключателя. */
  scenes: Container[];
  /** Экспорт сцены в PDF (через PdfExporter). */
  exportPdf: (root: Container) => Uint8Array;
  /** Скачивание байтов как файла. */
  download: (bytes: Uint8Array, filename: string) => void;
  /** Запрос перерисовки (Pixi + Skia) — вызывается после изменения сцены. */
  requestRender: () => void;
  /** Источник случайности для генератора фигур (по умолчанию Math.random). */
  rng?: Rng;
}

/**
 * Контроллер приложения: связывает переключатель сцен, генератор фигур и экспорт PDF
 * с кнопками UI. Не зависит от DOM/Pixi-рендерера напрямую — всё через `AppDeps` (тестируемо).
 */
export class AppController {
  private readonly switcher: SceneSwitcher;
  private readonly deps: AppDeps;

  constructor(deps: AppDeps) {
    this.deps = deps;
    this.switcher = new SceneSwitcher(deps.scenes);
    this.showActive();
  }

  get active(): Container {
    return this.switcher.current();
  }

  /** Кнопка «случайная фигура»: добавляет интерактивную фигуру в активную сцену. */
  onAddShape(): void {
    const shape = createRandomGraphics(this.deps.rng);
    makeInteractive(shape);
    this.switcher.current().addChild(shape);
    this.deps.requestRender();
  }

  /** Кнопка «следующая сцена»: переключает активную сцену. */
  onSwitchScene(): void {
    this.switcher.next();
    this.showActive();
    this.deps.requestRender();
  }

  /** Кнопка «экспорт в PDF»: экспортирует активную сцену и запускает скачивание. */
  onExportPdf(): void {
    const bytes = this.deps.exportPdf(this.switcher.current());
    this.deps.download(bytes, 'scene.pdf');
  }

  private showActive(): void {
    this.deps.stageRoot.removeChildren();
    this.deps.stageRoot.addChild(this.switcher.current());
  }
}
