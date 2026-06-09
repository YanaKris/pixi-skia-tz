function makeStub2DContext(): CanvasRenderingContext2D {
  const noop = (): void => {};

  const base: Record<string, unknown> = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineWidth: 1,
    fillRect: noop,
    clearRect: noop,
    strokeRect: noop,
    drawImage: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    setTransform: noop,
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(Math.max(1, w) * Math.max(1, h) * 4),
      width: Math.max(1, w),
      height: Math.max(1, h),
    }),
    putImageData: noop,
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(Math.max(1, w) * Math.max(1, h) * 4),
    }),
    measureText: () => ({ width: 0 }),
    getContextAttributes: () => ({}),
  };

  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      return () => undefined;
    },
    set(target, prop, value) {
      target[prop as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

HTMLCanvasElement.prototype.getContext = function (
  contextId: string
): RenderingContext | null {
  if (contextId === '2d') {
    return makeStub2DContext() as unknown as RenderingContext;
  }

  return null;
} as typeof HTMLCanvasElement.prototype.getContext;
