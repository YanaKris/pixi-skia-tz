import { Application, Container } from 'pixi.js-legacy';

export interface PixiStage {
  app: Application;
  root: Container;
}

export function createPixiStage(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): PixiStage {
  const app = new Application({
    view: canvas,
    forceCanvas: true,
    width,
    height,
    backgroundAlpha: 0,
    antialias: true,
    autoStart: false,
  });
  const root = new Container();
  app.stage.addChild(root);
  return { app, root };
}
