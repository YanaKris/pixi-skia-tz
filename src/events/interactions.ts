import { DisplayObject } from 'pixi.js-legacy';

/**
 * Включает интерактивность объекта: события указателя + курсор-указатель.
 * В Pixi v7 `eventMode='static'` соответствует прежнему `interactive=true`.
 */
export function makeInteractive(obj: DisplayObject): void {
  obj.eventMode = 'static';
  obj.cursor = 'pointer';
}

/** Ранее навешанные логгер-обработчики — чтобы повторный вызов не плодил дубли подписок. */
const boundLoggers = new WeakMap<DisplayObject, { down: () => void; up: () => void }>();

/**
 * Навешивает логирование `pointerdown`/`pointerup` (как в примере ТЗ: `g1 pointerdown!`).
 * Объект попутно делается интерактивным. Обработчики срабатывают и на Pixi-канвасе (нативно),
 * и на Skia-канвасе (через SkiaEventBridge → emit с тем же именем события).
 *
 * Идемпотентно: повторный вызов на том же объекте заменяет прежние обработчики (не дублирует).
 * `log` инъецируется ради тестируемости (по умолчанию — console.log).
 */
export function bindPointerLogging(
  obj: DisplayObject,
  name: string,
  log: (message: string) => void = (msg) => console.log(msg),
): void {
  makeInteractive(obj);

  const prev = boundLoggers.get(obj);
  if (prev) {
    obj.off('pointerdown', prev.down);
    obj.off('pointerup', prev.up);
  }

  const down = (): void => log(`${name} pointerdown!`);
  const up = (): void => log(`${name} pointerup!`);
  obj.on('pointerdown', down);
  obj.on('pointerup', up);
  boundLoggers.set(obj, { down, up });
}
