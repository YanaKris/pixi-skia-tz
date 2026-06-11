import { Container } from 'pixi.js-legacy';

/**
 * Переключатель преднастроенных сцен (вариант интерактивности из ТЗ).
 * Хранит список контейнеров и dirty-флаг: при смене сцены флаг взводится, чтобы рендер-цикл
 * перерисовал Skia-канвас. Изначально dirty=true — первая отрисовка нужна.
 */
export class SceneSwitcher {
  private index = 0;
  private dirty = true;

  constructor(private readonly scenes: Container[]) {
    if (scenes.length === 0) {
      throw new Error('SceneSwitcher: нужен хотя бы один контейнер');
    }
  }

  current(): Container {
    return this.scenes[this.index]!;
  }

  /** Переключает на следующую сцену (циклически) и помечает dirty. */
  next(): Container {
    this.index = (this.index + 1) % this.scenes.length;
    this.dirty = true;
    return this.current();
  }

  isDirty(): boolean {
    return this.dirty;
  }

  clearDirty(): void {
    this.dirty = false;
  }
}
