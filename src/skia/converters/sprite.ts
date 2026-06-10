import type { CanvasKit, Canvas, Image } from 'canvaskit-wasm';
import { Sprite } from 'pixi.js-legacy';
import { toSkMatrix } from './matrix';

export class SpriteImageCache {
  private readonly images = new Map<number, Image>();
  private readonly loading = new Map<number, Promise<boolean>>();

  has(uid: number): boolean {
    return this.images.has(uid);
  }

  get(uid: number): Image | undefined {
    return this.images.get(uid);
  }

  set(uid: number, image: Image): void {
    this.images.set(uid, image);
  }

  loadFromUrl(ck: CanvasKit, uid: number, url: string): Promise<boolean> {
    if (this.images.has(uid)) return Promise.resolve(true);
    const inFlight = this.loading.get(uid);
    if (inFlight) return inFlight;

    const promise = (async (): Promise<boolean> => {
      try {
        const res = await fetch(url);
        const bytes = new Uint8Array(await res.arrayBuffer());
        const image = ck.MakeImageFromEncoded(bytes);
        if (!image) return false;
        this.images.set(uid, image);
        return true;
      } catch {
        return false;
      } finally {
        this.loading.delete(uid);
      }
    })();

    this.loading.set(uid, promise);
    return promise;
  }

  dispose(): void {
    for (const image of this.images.values()) image.delete();
    this.images.clear();
  }
}

export function drawSprite(
  ck: CanvasKit,
  canvas: Canvas,
  sprite: Sprite,
  cache: SpriteImageCache,
): void {
  const tex = sprite.texture;
  const image = cache.get(tex.baseTexture.uid);
  if (!image) return;

  const frame = tex.frame;
  const ow = tex.orig.width;
  const oh = tex.orig.height;
  const ax = sprite.anchor.x * ow;
  const ay = sprite.anchor.y * oh;

  canvas.save();
  canvas.concat(toSkMatrix(sprite.worldTransform));
  const paint = new ck.Paint();
  canvas.drawImageRect(
    image,
    ck.LTRBRect(frame.x, frame.y, frame.x + frame.width, frame.y + frame.height),
    ck.LTRBRect(0 - ax, 0 - ay, ow - ax, oh - ay),
    paint,
  );
  paint.delete();
  canvas.restore();
}
