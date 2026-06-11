import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountLayout } from '../dom';
import { bindControls } from '../Controls';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('bindControls', () => {
  it('clicking buttons invokes the corresponding handlers', () => {
    const refs = mountLayout(document.body);
    const handlers = {
      onAddShape: vi.fn(),
      onSwitchScene: vi.fn(),
      onExportPdf: vi.fn(),
    };
    bindControls(refs, handlers);

    refs.addShapeBtn.click();
    refs.switchSceneBtn.click();
    refs.exportPdfBtn.click();

    expect(handlers.onAddShape).toHaveBeenCalledTimes(1);
    expect(handlers.onSwitchScene).toHaveBeenCalledTimes(1);
    expect(handlers.onExportPdf).toHaveBeenCalledTimes(1);
  });

  it('does not invoke unrelated handlers', () => {
    const refs = mountLayout(document.body);
    const handlers = {
      onAddShape: vi.fn(),
      onSwitchScene: vi.fn(),
      onExportPdf: vi.fn(),
    };
    bindControls(refs, handlers);

    refs.addShapeBtn.click();

    expect(handlers.onSwitchScene).not.toHaveBeenCalled();
    expect(handlers.onExportPdf).not.toHaveBeenCalled();
  });

  it('the unsubscribe function removes event listeners', () => {
    const refs = mountLayout(document.body);
    const handlers = {
      onAddShape: vi.fn(),
      onSwitchScene: vi.fn(),
      onExportPdf: vi.fn(),
    };

    const unbind = bindControls(refs, handlers);
    unbind();

    refs.addShapeBtn.click();
    refs.switchSceneBtn.click();

    expect(handlers.onAddShape).not.toHaveBeenCalled();
    expect(handlers.onSwitchScene).not.toHaveBeenCalled();
  });
});
