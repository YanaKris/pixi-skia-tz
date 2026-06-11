import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, Graphics } from 'pixi.js-legacy';
import { SkiaEventBridge } from '../SkiaEventBridge';

beforeEach(() => {
  document.body.innerHTML = '';
});

function makeCanvas(w = 400, h = 300): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  document.body.appendChild(canvas);
  return canvas;
}

describe('SkiaEventBridge', () => {
  it('dispatches pointerdown to the target when the pointer is inside a shape', () => {
    const root = new Container();
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 100, 100).endFill();
    g.eventMode = 'static';
    root.addChild(g);
    const onDown = vi.fn();
    g.on('pointerdown', onDown);

    const canvas = makeCanvas();
    const bridge = new SkiaEventBridge(root, canvas);
    bridge.attach();

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 50, clientY: 50, bubbles: true }),
    );
    expect(onDown).toHaveBeenCalledTimes(1);
  });

  it('dispatches pointerup in the same way', () => {
    const root = new Container();
    const g = new Graphics().beginFill(0x00ff00).drawRect(0, 0, 80, 80).endFill();
    g.eventMode = 'static';
    root.addChild(g);
    const onUp = vi.fn();
    g.on('pointerup', onUp);

    const canvas = makeCanvas();
    new SkiaEventBridge(root, canvas).attach();
    canvas.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 10, clientY: 10, bubbles: true }),
    );
    expect(onUp).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler when clicking outside the shape', () => {
    const root = new Container();
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 10, 10).endFill();
    g.eventMode = 'static';
    root.addChild(g);
    const onDown = vi.fn();
    g.on('pointerdown', onDown);

    const canvas = makeCanvas();
    new SkiaEventBridge(root, canvas).attach();
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 300, clientY: 250, bubbles: true }),
    );
    expect(onDown).not.toHaveBeenCalled();
  });

  it('takes transformations into account (translated/rotated object)', () => {
    const root = new Container();
    const sub = new Container();
    sub.position.set(100, 50);

    const g = new Graphics().beginFill(0x0000ff).drawRect(0, 0, 40, 40).endFill();
    g.eventMode = 'static';

    sub.addChild(g);
    root.addChild(sub);

    const onDown = vi.fn();
    g.on('pointerdown', onDown);

    const canvas = makeCanvas();
    new SkiaEventBridge(root, canvas).attach();

    // world coordinates of the rectangle: [100..140] x [50..90]
    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 120, clientY: 70, bubbles: true }),
    );

    expect(onDown).toHaveBeenCalledTimes(1);
  });

  it('removes event listeners on detach', () => {
    const root = new Container();
    const g = new Graphics().beginFill(0xff0000).drawRect(0, 0, 100, 100).endFill();
    g.eventMode = 'static';
    root.addChild(g);

    const onDown = vi.fn();
    g.on('pointerdown', onDown);

    const canvas = makeCanvas();
    const bridge = new SkiaEventBridge(root, canvas);

    bridge.attach();
    bridge.detach();

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 50, clientY: 50, bubbles: true }),
    );

    expect(onDown).not.toHaveBeenCalled();
  });
});
