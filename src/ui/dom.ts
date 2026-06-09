export interface LayoutRefs {
  pixiCanvas: HTMLCanvasElement;
  skiaCanvas: HTMLCanvasElement;
  addShapeBtn: HTMLButtonElement;
  switchSceneBtn: HTMLButtonElement;
  exportPdfBtn: HTMLButtonElement;
}

function canvas(id: string, width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.id = id;
  c.width = width;
  c.height = height;
  return c;
}

function button(label: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  return b;
}

export function mountLayout(parent: HTMLElement): LayoutRefs {
  const controls = document.createElement("div");
  controls.className = "controls";

  const addShapeBtn = button("Случайная фигура");
  const switchSceneBtn = button("Следующая сцена");
  const exportPdfBtn = button("Экспорт в PDF");
  controls.append(addShapeBtn, switchSceneBtn, exportPdfBtn);

  const stage = document.createElement("div");
  stage.className = "stage";
  const pixiCanvas = canvas("pixi-canvas", 800, 600);
  const skiaCanvas = canvas("skia-canvas", 800, 600);
  stage.append(pixiCanvas, skiaCanvas);

  parent.append(controls, stage);

  return { pixiCanvas, skiaCanvas, addShapeBtn, switchSceneBtn, exportPdfBtn };
}
