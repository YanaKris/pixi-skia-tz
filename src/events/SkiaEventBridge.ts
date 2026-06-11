// import { Container, EventBoundary, DisplayObject } from 'pixi.js-legacy';

// const tempParent = new Container();

// export class SkiaEventBridge {
//   private readonly boundary = new EventBoundary();

//   private readonly root: Container;
//   private readonly canvas: HTMLCanvasElement;

//   constructor(root: Container, canvas: HTMLCanvasElement) {
//     this.root = root;
//     this.canvas = canvas;
//     this.boundary = new EventBoundary(root);
//   }

//   attach(): void {
//     this.canvas.addEventListener('pointerdown', this.handlePointerDown);
//     this.canvas.addEventListener('pointerup', this.handlePointerUp);
//   }

//   detach(): void {
//     this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
//     this.canvas.removeEventListener('pointerup', this.handlePointerUp);
//   }

//   private readonly handlePointerDown = (e: PointerEvent): void => this.dispatch('pointerdown', e);
//   private readonly handlePointerUp = (e: PointerEvent): void => this.dispatch('pointerup', e);

//   private dispatch(type: string, e: PointerEvent): void {
//     const { x, y } = this.toCanvasCoords(e);
//     this.updateTransforms();
//     const target = this.boundary.hitTest(x, y) as DisplayObject | null;
//     if (target) {
//       const payload = { type, global: { x, y }, nativeEvent: e };
//       (target as unknown as { emit(event: string, payload: unknown): void }).emit(type, payload);
//     }
//   }

//   private updateTransforms(): void {
//     const cached = this.root.parent;
//     this.root.parent = tempParent;
//     try {
//       this.root.updateTransform();
//     } finally {
//       this.root.parent = cached;
//     }
//   }

//   private toCanvasCoords(e: PointerEvent): { x: number; y: number } {
//     const rect = this.canvas.getBoundingClientRect();
//     const sx = rect.width ? this.canvas.width / rect.width : 1;
//     const sy = rect.height ? this.canvas.height / rect.height : 1;
//     return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
//   }
// }

import { Container, EventBoundary, DisplayObject } from 'pixi.js-legacy';
import { updateStandaloneTransform } from '../skia/sceneTransform';

interface SkiaPointerPayload {
  type: string;
  global: { x: number; y: number };
  nativeEvent: PointerEvent;
}

export class SkiaEventBridge {
  private readonly boundary = new EventBoundary();
  private attached = false;

  private readonly root: Container;
  private readonly canvas: HTMLCanvasElement;

  constructor(root: Container, canvas: HTMLCanvasElement) {
    this.root = root;
    this.canvas = canvas;
    this.boundary = new EventBoundary(root);
  }

  attach(): void {
    if (this.attached) return;
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.attached = true;
  }

  detach(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.attached = false;
  }

  private readonly handlePointerDown = (e: PointerEvent): void => this.dispatch('pointerdown', e);
  private readonly handlePointerUp = (e: PointerEvent): void => this.dispatch('pointerup', e);

  private dispatch(type: string, e: PointerEvent): void {
    const { x, y } = this.toCanvasCoords(e);
    // hitTest требует актуальных worldTransform (учёт трансформаций объектов).
    updateStandaloneTransform(this.root);

    const hit = this.boundary.hitTest(x, y) as DisplayObject | null;
    // hitTest по типам не nullable, но фактически может вернуть null/undefined или сам root
    // при промахе — это не цель события.
    if (!hit || hit === this.root) return;

    const payload: SkiaPointerPayload = { type, global: { x, y }, nativeEvent: e };
    this.bubble(hit, type, payload);
  }

  /** Эмулирует всплытие Pixi: target → предки до root включительно. */
  private bubble(target: DisplayObject, type: string, payload: SkiaPointerPayload): void {
    let node: DisplayObject | null = target;
    while (node) {
      (node.emit as (event: string, payload: SkiaPointerPayload) => void)(type, payload);
      if (node === this.root) break;
      node = node.parent;
    }
  }

  /** Переводит клиентские координаты события в координаты канваса (с учётом масштаба отображения). */
  private toCanvasCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const sx = rect.width ? this.canvas.width / rect.width : 1;
    const sy = rect.height ? this.canvas.height / rect.height : 1;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }
}
