import { describe, it, expect } from 'vitest';
import { Container, RENDERER_TYPE } from 'pixi.js-legacy';
import { createPixiStage } from '../PixiStage';

describe('createPixiStage', () => {
  it('создаёт Application в режиме forceCanvas (CanvasRenderer)', () => {
    const canvas = document.createElement('canvas');
    const stage = createPixiStage(canvas, 400, 300);
    // forceCanvas=true → рендерер именно Canvas, а не WebGL (требование ТЗ)
    expect(stage.app.renderer.type).toBe(RENDERER_TYPE.CANVAS);
    stage.app.destroy(false);
  });

  it('добавляет root-контейнер в stage', () => {
    const canvas = document.createElement('canvas');
    const stage = createPixiStage(canvas, 200, 150);
    expect(stage.root).toBeInstanceOf(Container);
    expect(stage.app.stage.children).toContain(stage.root);
    stage.app.destroy(false);
  });
});
