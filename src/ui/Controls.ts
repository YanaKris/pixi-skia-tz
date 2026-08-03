import type { LayoutRefs } from './dom';

export interface ControlHandlers {
  onAddShape(): void;
  onSwitchScene(): void;
  onExportPdf(): void;
}

export function bindControls(refs: LayoutRefs, handlers: ControlHandlers): () => void {
  const onAdd = (): void => handlers.onAddShape();
  const onSwitch = (): void => handlers.onSwitchScene();
  const onExport = (): void => handlers.onExportPdf();

  refs.addShapeBtn.addEventListener('click', onAdd);
  refs.switchSceneBtn.addEventListener('click', onSwitch);
  refs.exportPdfBtn.addEventListener('click', onExport);

  return () => {
    refs.addShapeBtn.removeEventListener('click', onAdd);
    refs.switchSceneBtn.removeEventListener('click', onSwitch);
    refs.exportPdfBtn.removeEventListener('click', onExport);
  };
}
