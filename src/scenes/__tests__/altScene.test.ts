import { describe, it, expect } from 'vitest';
import { Container, Graphics, SHAPES } from 'pixi.js-legacy';
import { buildAltScene } from '../altScene';
import { buildExampleScene } from '../exampleScene';
import { extractGraphicsParts } from '../../skia/converters/graphics';

describe('buildAltScene', () => {
  it('структура: subContainer с двумя фигурами + c1 и c2 на верхнем уровне', () => {
    const root = buildAltScene();
    expect(root.children).toHaveLength(3);
    const sub = root.children[0] as Container;

    expect(sub).toBeInstanceOf(Container);
    expect(sub.position.x).toBe(80);
    expect(sub.position.y).toBe(120);
    expect(sub.children).toHaveLength(2); // треугольник + линия
  });

  it('c1: зелёный круг, позиция (550,150), интерактивен', () => {
    const root = buildAltScene();
    const c1 = root.children[1] as Graphics;
    expect(c1.position.x).toBe(550);
    expect(c1.position.y).toBe(150);
    expect(c1.eventMode).toBe('static'); // bindPointerLogging
    const parts = extractGraphicsParts(c1);
    expect(parts[0]!.shape.type).toBe(SHAPES.CIRC);
    expect(parts[0]!.fillStyle.color).toBe(0x00aa00);
  });

  it('c2: оранжевый скруглённый прямоугольник, позиция (250,420), угол -10, интерактивен', () => {
    const root = buildAltScene();
    const c2 = root.children[2] as Graphics;
    expect(c2.position.x).toBe(250);
    expect(c2.position.y).toBe(420);
    expect(c2.angle).toBeCloseTo(-10, 6);
    expect(c2.eventMode).toBe('static');
    const parts = extractGraphicsParts(c2);
    expect(parts[0]!.shape.type).toBe(SHAPES.RREC);
    expect(parts[0]!.fillStyle.color).toBe(0xff8800);
  });

  it('subContainer: фиолетовый треугольник (Polygon) и голубая линия', () => {
    const root = buildAltScene();
    const sub = root.children[0] as Container;
    const tri = sub.children[0] as Graphics;
    const line = sub.children[1] as Graphics;

    const triParts = extractGraphicsParts(tri);
    expect(triParts[0]!.shape.type).toBe(SHAPES.POLY);
    expect(triParts[0]!.fillStyle.visible).toBe(true);
    expect(triParts[0]!.fillStyle.color).toBe(0xaa00ff);

    const lineParts = extractGraphicsParts(line);
    expect(lineParts[0]!.shape.type).toBe(SHAPES.POLY);
    expect(lineParts[0]!.lineStyle.visible).toBe(true);
    expect(lineParts[0]!.lineStyle.width).toBe(8);
    expect(lineParts[0]!.lineStyle.color).toBe(0x00ffff);
  });

  it('содержимое отличается от сцены-примера (ТЗ: «различное содержимое»)', () => {
    const collectShapeTypes = (root: Container): number[] => {
      const types: number[] = [];
      const walk = (node: Container): void => {
        if (node instanceof Graphics) {
          for (const part of extractGraphicsParts(node)) types.push(part.shape.type);
        }
        for (const child of node.children) walk(child as Container);
      };
      walk(root);
      return types.sort();
    };
    const alt = collectShapeTypes(buildAltScene());
    const example = collectShapeTypes(buildExampleScene());
    expect(alt).not.toEqual(example);
    expect(alt).toContain(SHAPES.CIRC);
    expect(alt).toContain(SHAPES.RREC);
    expect(example).not.toContain(SHAPES.CIRC);
    expect(example).not.toContain(SHAPES.RREC);
  });
});
