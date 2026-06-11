import { Container, Graphics } from 'pixi.js-legacy';
import { bindPointerLogging } from '../events/interactions';

/**
 * Сцена-пример из ТЗ: subContainer с двумя линиями (g3, g4) + эллипс (g1) и прямоугольник (g2)
 * с трансформациями. g1/g2 интерактивны и логируют pointer-события (как в задании).
 */
export function buildExampleScene(): Container {
  const main = new Container();
  const sub = new Container();
  const g1 = new Graphics();
  const g2 = new Graphics();
  const g3 = new Graphics();
  const g4 = new Graphics();

  g1.beginFill('#ff0000').drawEllipse(0, 0, 200, 100).endFill();
  g1.position.set(200, 100);
  g1.angle = 30;
  bindPointerLogging(g1, 'g1');

  g2.beginFill('#0000ff').drawRect(-50, -75, 100, 150).endFill();
  g2.position.set(120, 60);
  g2.angle = 15;
  g2.scale.set(1.5, 1.7);
  bindPointerLogging(g2, 'g2');

  g3.lineStyle(10, '#ffffff', 1).moveTo(0, 0).lineTo(150, 100);
  g3.angle = -20;

  g4.lineStyle(10, '#ffff00', 1).moveTo(0, 70).lineTo(150, -30);
  g4.angle = 20;

  sub.position.set(75, 50);
  sub.addChild(g3, g4);
  main.addChild(sub, g1, g2);
  return main;
}
