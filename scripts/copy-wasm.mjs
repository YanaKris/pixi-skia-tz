/**
 * Кладёт CanvasKit (canvaskit.js + canvaskit.wasm) в public/ для рантайма.
 *
 * Если файлы уже на месте — НИЧЕГО не делает: там может лежать кастомная сборка
 * с PDF backend (build-skia/), которую нельзя затирать. Принудительная перезапись
 * стоковой сборкой: `npm run copy:wasm -- --force`.
 *
 * Запускается автоматически через predev/prebuild, чтобы свежий клон работал
 * сразу после `npm install` (стоковый CanvasKit: рендер есть, PDF-экспорт недоступен).
 */
import { access, copyFile, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(root, 'node_modules', 'canvaskit-wasm', 'bin');
const DEST = path.join(root, 'public');
const FILES = ['canvaskit.js', 'canvaskit.wasm'];

const exists = (p) =>
  access(p, constants.F_OK).then(
    () => true,
    () => false,
  );

const force = process.argv.includes('--force');
const allPresent = (await Promise.all(FILES.map((f) => exists(path.join(DEST, f))))).every(
  Boolean,
);

if (allPresent && !force) {
  console.log(
    '[copy:wasm] public/canvaskit.{js,wasm} уже на месте — пропускаю ' +
      '(кастомная сборка не перезаписывается; форсировать: npm run copy:wasm -- --force)',
  );
} else {
  await mkdir(DEST, { recursive: true });
  for (const f of FILES) {
    await copyFile(path.join(SRC, f), path.join(DEST, f));
  }
  console.log(
    '[copy:wasm] стоковый CanvasKit скопирован в public/ (рендер работает, PDF backend недоступен — см. build-skia/README.md)',
  );
}
