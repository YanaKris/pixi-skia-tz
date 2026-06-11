import { Container, Graphics } from 'pixi.js-legacy';
import { bindPointerLogging } from '../events/interactions';

export function buildAltScene(): Container {
  const main = new Container();
  const sub = new Container();
  const c1 = new Graphics();
  const c2 = new Graphics();
  const tri = new Graphics();
  const line = new Graphics();

  c1.beginFill('#00aa00').drawCircle(0, 0, 90).endFill();
  c1.position.set(550, 150);
  bindPointerLogging(c1, 'c1');

  c2.beginFill('#ff8800').drawRoundedRect(-100, -50, 200, 100, 24).endFill();
  c2.position.set(250, 420);
  c2.angle = -10;
  bindPointerLogging(c2, 'c2');

  tri.beginFill('#aa00ff').drawPolygon([0, 0, 160, 0, 80, -120]).endFill();

  line.lineStyle(8, '#00ffff', 1).moveTo(0, 20).lineTo(200, 100);

  sub.position.set(80, 120);
  sub.addChild(tri, line);
  main.addChild(sub, c1, c2);
  return main;
}
