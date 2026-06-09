export interface AffineLike {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export function toSkMatrix(m: AffineLike): number[] {
  return [m.a, m.c, m.tx, m.b, m.d, m.ty, 0, 0, 1];
}