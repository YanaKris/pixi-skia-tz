import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js-legacy';
import { SceneSwitcher } from '../sceneSwitcher';

describe('SceneSwitcher', () => {
  it('current() возвращает первую сцену, изначально dirty', () => {
    const a = new Container();
    const b = new Container();
    const sw = new SceneSwitcher([a, b]);
    expect(sw.current()).toBe(a);
    expect(sw.isDirty()).toBe(true);
  });

  it('next() переключает на следующую и помечает dirty', () => {
    const a = new Container();
    const b = new Container();
    const sw = new SceneSwitcher([a, b]);
    sw.clearDirty();
    expect(sw.next()).toBe(b);
    expect(sw.current()).toBe(b);
    expect(sw.isDirty()).toBe(true);
  });

  it('clearDirty() сбрасывает флаг (true → false)', () => {
    const sw = new SceneSwitcher([new Container()]);
    expect(sw.isDirty()).toBe(true);
    sw.clearDirty();
    expect(sw.isDirty()).toBe(false);
  });

  it('циклически возвращается с последней на первую', () => {
    const a = new Container();
    const b = new Container();
    const sw = new SceneSwitcher([a, b]);
    sw.next(); // b
    expect(sw.next()).toBe(a); // снова a
  });

  it('бросает на пустом списке сцен', () => {
    expect(() => new SceneSwitcher([])).toThrow();
  });
});
