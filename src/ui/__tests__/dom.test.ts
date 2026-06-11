import { describe, it, expect, beforeEach } from 'vitest';
import { mountLayout } from '../dom';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('mountLayout', () => {
  it('creates two canvases and three control buttons', () => {
    const refs = mountLayout(document.body);
    expect(refs.pixiCanvas.tagName).toBe('CANVAS');
    expect(refs.skiaCanvas.tagName).toBe('CANVAS');
    expect(refs.addShapeBtn).toBeInstanceOf(HTMLButtonElement);
    expect(refs.switchSceneBtn).toBeInstanceOf(HTMLButtonElement);
    expect(refs.exportPdfBtn).toBeInstanceOf(HTMLButtonElement);
  });

  it('mounts elements into the provided container', () => {
    mountLayout(document.body);
    expect(document.querySelectorAll('canvas')).toHaveLength(2);
    expect(document.querySelectorAll('button')).toHaveLength(3);
  });

  it('creates canvases with unique ids', () => {
    const refs = mountLayout(document.body);
    expect(refs.pixiCanvas.id).not.toBe(refs.skiaCanvas.id);
    expect(refs.pixiCanvas.id).toBeTruthy();
  });
});
