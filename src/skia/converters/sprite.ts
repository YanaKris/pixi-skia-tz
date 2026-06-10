import type { CanvasKit, Canvas, Image } from 'canvaskit-wasm';
import { Sprite } from 'pixi.js-legacy';
import { toSkMatrix } from './matrix';

export class SpriteImageCache {
  private readonly images = new Map<number, Image>();

  has(uid: number): boolean {
    return this.images.has(uid);
  }

  get(uid: number): Image | undefined {
    return this.images.get(uid);
  }

  set(uid: number, image: Image): void {
    this.images.set(uid, image);
  }

  async loadFromUrl(ck: CanvasKit, uid: number, url: string): Promise<boolean> {
    if (this.images.has(uid)) return true;
    const res = await fetch(url);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const image = ck.MakeImageFromEncoded(bytes);
    if (!image) return false;
    this.images.set(uid, image);
    return true;
  }

  dispose(): void {
    for (const image of this.images.values()) image.delete();
    this.images.clear();
  }
}

export function drawSprite(ck: CanvasKit, canvas: Canvas, sprite: Sprite, cache: SpriteImageCache): void {
  const uid = sprite.texture.baseTexture.uid;
  const image = cache.get(uid);
  if (!image) return;

  const w = sprite.texture.width;
  const h = sprite.texture.height;
  const ax = sprite.anchor.x * w;
  const ay = sprite.anchor.y * h;

  canvas.save();
  canvas.concat(toSkMatrix(sprite.worldTransform));
  const paint = new ck.Paint();
  canvas.drawImageRect(image, ck.LTRBRect(0, 0, w, h), ck.LTRBRect(-ax, -ay, w - ax, h - ay), paint);
  paint.delete();
  canvas.restore();
}
