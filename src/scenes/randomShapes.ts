import { Graphics } from 'pixi.js-legacy';

/** Источник случайности; инъецируется ради детерминированных тестов (по умолчанию Math.random). */
export type Rng = () => number;

const PALETTE = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff];

/**
 * Создаёт случайную фигуру/линию (`PIXI.Graphics`) — для кнопки «сгенерировать» из ТЗ.
 * Тип, цвет, размер, позиция и угол определяются по `rng`, поэтому при фиксированном `rng`
 * результат детерминирован (тестируемо).
 */
export function createRandomGraphics(rng: Rng = Math.random): Graphics {
  const g = new Graphics();
  const kind = Math.floor(rng() * 4); // 0 rect · 1 ellipse · 2 circle · 3 line
  const color = PALETTE[Math.floor(rng() * PALETTE.length)]!;

  switch (kind) {
    case 0:
      g.beginFill(color)
        .drawRect(0, 0, 20 + rng() * 80, 20 + rng() * 80)
        .endFill();
      break;
    case 1:
      g.beginFill(color)
        .drawEllipse(0, 0, 20 + rng() * 60, 15 + rng() * 50)
        .endFill();
      break;
    case 2:
      g.beginFill(color)
        .drawCircle(0, 0, 15 + rng() * 45)
        .endFill();
      break;
    default:
      g.lineStyle(2 + rng() * 8, color, 1)
        .moveTo(0, 0)
        .lineTo(rng() * 150, rng() * 150);
      break;
  }

  g.position.set(rng() * 400, rng() * 300);
  g.angle = rng() * 360;
  return g;
}
