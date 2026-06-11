import { Container } from 'pixi.js-legacy';

export class SceneSwitcher {
  private readonly scenes: Container[];

  private index = 0;
  private dirty = true;

  constructor(scenes: Container[]) {
    if (scenes.length === 0) {
      throw new Error('SceneSwitcher: нужен хотя бы один контейнер');
    }

    this.scenes = scenes;
  }

  current(): Container {
    return this.scenes[this.index]!;
  }

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
