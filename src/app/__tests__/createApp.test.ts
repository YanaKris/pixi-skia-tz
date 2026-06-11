import { describe, it, expect, vi } from 'vitest';
import { Container } from 'pixi.js-legacy';
import { AppController, type AppDeps } from '../createApp';

function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  const stageRoot = new Container();
  const sceneA = new Container();
  const sceneB = new Container();
  return {
    stageRoot,
    scenes: [sceneA, sceneB],
    exportPdf: vi.fn(() => new Uint8Array([0x25, 0x50, 0x44, 0x46])),
    download: vi.fn(),
    requestRender: vi.fn(),
    rng: () => 0,
    ...overrides,
  };
}

describe('AppController', () => {
  it('при старте показывает первую сцену в stageRoot', () => {
    const deps = makeDeps();
    const app = new AppController(deps);
    expect(deps.stageRoot.children).toContain(deps.scenes[0]);
    expect(app.active).toBe(deps.scenes[0]);
  });

  it('onAddShape добавляет фигуру в активную сцену и просит перерисовку', () => {
    const deps = makeDeps();
    const app = new AppController(deps);
    const before = app.active.children.length;
    app.onAddShape();
    expect(app.active.children.length).toBe(before + 1);
    expect(deps.requestRender).toHaveBeenCalled();
  });

  it('onSwitchScene переключает активную сцену в stageRoot', () => {
    const deps = makeDeps();
    const app = new AppController(deps);
    app.onSwitchScene();
    expect(app.active).toBe(deps.scenes[1]);
    expect(deps.stageRoot.children).toContain(deps.scenes[1]);
    expect(deps.stageRoot.children).not.toContain(deps.scenes[0]);
    expect(deps.requestRender).toHaveBeenCalled();
  });

  it('onExportPdf экспортирует активную сцену и запускает скачивание', () => {
    const deps = makeDeps();
    const app = new AppController(deps);
    app.onExportPdf();
    expect(deps.exportPdf).toHaveBeenCalledWith(app.active);
    expect(deps.download).toHaveBeenCalledTimes(1);
    const [bytes, name] = (deps.download as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(bytes[0]).toBe(0x25);
    expect(name).toMatch(/\.pdf$/);
  });

  it('добавленная фигура интерактивна (eventMode static)', () => {
    const deps = makeDeps();
    const app = new AppController(deps);
    app.onAddShape();
    const added = app.active.children[app.active.children.length - 1]!;
    expect(added.eventMode).toBe('static');
  });
});
