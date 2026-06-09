export function toRgba01(rgb: number, alpha: number): [number, number, number, number] {
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  const a = Math.min(1, Math.max(0, alpha));
  return [r, g, b, a];
}
