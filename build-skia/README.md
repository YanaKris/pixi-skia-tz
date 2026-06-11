# Кастомная WASM-сборка Skia с PDF backend

Стоковый `canvaskit-wasm` из npm **не содержит** PDF backend. Здесь собирается кастомный
CanvasKit с экспортом `MakePDFDocument` (см. `canvaskit_pdf_bindings.cpp`), чтобы экспортировать
сцену в **векторный** PDF (графика — векторные операторы, спрайты — bitmap).

## Состав
- `canvaskit_pdf_bindings.cpp` — embind-биндинги SkPDF (`MakePDFDocument` → `beginPage/endPage/close/bytes`).
- `build.sh` — патчит GN-таргет CanvasKit (добавляет наш cpp + включает PDF) и запускает официальный `compile.sh`.
- `Dockerfile` — воспроизводимое окружение (emscripten + Skia + depot_tools).

## Сборка (Docker)

```bash
# из каталога build-skia/ — артефакты попадут в ../wasm/
docker build -f Dockerfile --output type=local,dest=../wasm .
```

Результат: `wasm/canvaskit.js` + `wasm/canvaskit.wasm` с PDF API. Сборка занимает десятки
минут (клон Skia + `git-sync-deps` ~1–2 ГБ + компиляция).

## Подключение в приложении
`wasm/` раздаётся как статика (Vite), `loadCanvasKit` грузит `/canvaskit.wasm`, `PdfExporter`
использует `MakePDFDocument`. PDF-тесты (`src/pdf/__tests__`) gated: выполняются только при
наличии собранного артефакта.

## Возможные доводки (R&D)
Сборка CanvasKit чувствительна к версиям. Если падает:
- подобрать тег `emscripten/emsdk` под текущий Skia;
- сверить имена GN-аргументов PDF (`skia_enable_pdf`/`skia_use_pdf`) с версией Skia;
- проверить, что `canvaskit_pdf_bindings.cpp` попал в `sources` GN-таргета и заголовки `include/docs/` доступны.

