set -euo pipefail

SKIA_DIR="${SKIA_DIR:-/build/skia}"
cd "$SKIA_DIR"
CK="modules/canvaskit"

echo "==> Inlining PDF bindings into the main translation unit: canvaskit_bindings.cpp"
python3 - <<'PY'
import pathlib, sys
main = pathlib.Path("modules/canvaskit/canvaskit_bindings.cpp")
inc = '#include "canvaskit_pdf_bindings.cpp"'
txt = main.read_text()
if inc in txt:
    print("  = already included")
elif not pathlib.Path("modules/canvaskit/canvaskit_pdf_bindings.cpp").exists():
    sys.exit("ERROR: canvaskit_pdf_bindings.cpp was not copied into modules/canvaskit/")
else:
    main.write_text(txt + "\n\n// --- PDF backend (custom bindings) ---\n" + inc + "\n")
    print("  + canvaskit_pdf_bindings.cpp included in canvaskit_bindings.cpp")
PY

echo "==> Enabling PDF in compile.sh (skia_enable_pdf=false → true)"
python3 - <<'PY'
import pathlib, sys
sh = pathlib.Path("modules/canvaskit/compile.sh")
txt = sh.read_text()
if "skia_enable_pdf=true" in txt and "skia_enable_pdf=false" not in txt:
    print("  = PDF already enabled")
elif "skia_enable_pdf=false" in txt:
    sh.write_text(txt.replace("skia_enable_pdf=false", "skia_enable_pdf=true"))
    print("  + skia_enable_pdf=true")
else:
    sys.exit("ERROR: 'skia_enable_pdf=' not found in compile.sh — GN args structure has changed")
PY

echo "==> Running the official CanvasKit build (release build = no arguments)"
export EMSDK_QUIET=1
bash "$CK/compile.sh"

echo "==> Copying build artifacts"
OUT="${OUT_DIR:-/artifacts}"
mkdir -p "$OUT"
SRC="out/canvaskit_wasm"

if [[ ! -f "$SRC/canvaskit.wasm" ]]; then
  echo "ERROR: artifact $SRC/canvaskit.wasm was not generated — build failed" >&2
  exit 1
fi

cp "$SRC/canvaskit.js" "$SRC/canvaskit.wasm" "$OUT/"
ls -la "$OUT"

echo "==> Verifying PDF API export"
if grep -q "MakePDFDocument" "$OUT/canvaskit.wasm"; then
  echo "  OK: MakePDFDocument is present in the .wasm (registered in Module at runtime)"
else
  echo "  ! MakePDFDocument not found in canvaskit.wasm — check bindings/linking" >&2
  exit 1
fi