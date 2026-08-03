import { describe, it, expect } from 'vitest';
import { Container, Graphics, SHAPES } from 'pixi.js-legacy';
import { buildExampleScene } from '../exampleScene';
import { extractGraphicsParts } from '../../skia/converters/graphics';

describe('buildExampleScene', () => {
  it('воспроизводит структуру сцены из ТЗ', () => {
    const root = buildExampleScene();
    // mainContainer: subContainer, g1, g2
    expect(root.children).toHaveLength(3);
    const sub = root.children[0] as Container;

    expect(sub).toBeInstanceOf(Container);
    expect(sub.position.x).toBe(75);
    expect(sub.position.y).toBe(50);
    expect(sub.children).toHaveLength(2); // g3, g4
  });

  it('g1: эллипс, позиция (200,100), угол 30, интерактивен', () => {
    const root = buildExampleScene();
    const g1 = root.children[1] as Graphics;
    expect(g1.position.x).toBe(200);
    expect(g1.position.y).toBe(100);
    expect(g1.angle).toBeCloseTo(30, 6);
    expect(g1.eventMode).toBe('static'); // bindPointerLogging
    const g1parts = extractGraphicsParts(g1);
    expect(g1parts[0]!.shape.type).toBe(SHAPES.ELIP);
    expect(g1parts[0]!.fillStyle.color).toBe(0xff0000); // красный из ТЗ
  });

  it('g2: прямоугольник #0000ff, позиция (120,60), угол 15, масштаб (1.5,1.7)', () => {
    const root = buildExampleScene();
    const g2 = root.children[2] as Graphics;
    expect(g2.position.x).toBe(120);
    expect(g2.position.y).toBe(60);
    expect(g2.angle).toBeCloseTo(15, 6);
    expect(g2.scale.x).toBeCloseTo(1.5, 6);
    expect(g2.scale.y).toBeCloseTo(1.7, 6);
    const g2parts = extractGraphicsParts(g2);
    expect(g2parts[0]!.shape.type).toBe(SHAPES.RECT);
    expect(g2parts[0]!.fillStyle.color).toBe(0x0000ff); // синий из ТЗ
  });

  it('g3/g4: линии (Polygon) с углами -20 и 20', () => {
    const root = buildExampleScene();
    const sub = root.children[0] as Container;
    const g3 = sub.children[0] as Graphics;
    const g4 = sub.children[1] as Graphics;
    expect(g3.angle).toBeCloseTo(-20, 6);
    expect(g4.angle).toBeCloseTo(20, 6);
    // линии финализируются через extractGraphicsParts (finishPoly)
    const g3parts = extractGraphicsParts(g3);
    expect(g3parts[0]!.shape.type).toBe(SHAPES.POLY);
    expect(g3parts[0]!.lineStyle.width).toBe(10);
    expect(g3parts[0]!.lineStyle.visible).toBe(true);
    expect(g3parts[0]!.lineStyle.color).toBe(0xffffff); // белый из ТЗ
    expect(extractGraphicsParts(g4)[0]!.lineStyle.color).toBe(0xffff00); // жёлтый из ТЗ
  });
});
