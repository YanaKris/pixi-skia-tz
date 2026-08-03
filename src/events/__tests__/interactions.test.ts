import { describe, it, expect, vi } from 'vitest';
import { Graphics, type FederatedPointerEvent } from 'pixi.js-legacy';
import { makeInteractive, bindPointerLogging } from '../interactions';

describe('makeInteractive', () => {
  it('включает eventMode=static и курсор pointer', () => {
    const g = new Graphics();
    makeInteractive(g);
    expect(g.eventMode).toBe('static');
    expect(g.cursor).toBe('pointer');
  });
});

describe('bindPointerLogging', () => {
  it('логирует pointerdown и pointerup с именем объекта', () => {
    const g = new Graphics();
    const log = vi.fn();

    bindPointerLogging(g, 'g1', log);
    g.emit('pointerdown', {} as FederatedPointerEvent);
    g.emit('pointerup', {} as FederatedPointerEvent);

    expect(log).toHaveBeenNthCalledWith(1, 'g1 pointerdown!');
    expect(log).toHaveBeenNthCalledWith(2, 'g1 pointerup!');
  });

  it('делает объект интерактивным заодно', () => {
    const g = new Graphics();
    bindPointerLogging(g, 'g2', vi.fn());
    expect(g.eventMode).toBe('static');
  });

  it('идемпотентно: повторный вызов не дублирует подписку', () => {
    const g = new Graphics();
    const log = vi.fn();
    bindPointerLogging(g, 'g3', log);
    bindPointerLogging(g, 'g3', log); // повторно — прежние обработчики сняты

    g.emit('pointerdown', {} as FederatedPointerEvent);
    expect(log).toHaveBeenCalledTimes(1); // не 2
  });

  it('по умолчанию использует console.log', () => {
    const g = new Graphics();
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    bindPointerLogging(g, 'g4');
    g.emit('pointerdown', {} as FederatedPointerEvent);
    expect(spy).toHaveBeenCalledWith('g4 pointerdown!');
    spy.mockRestore();
  });
});
