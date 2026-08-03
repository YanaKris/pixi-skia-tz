#include "include/core/SkCanvas.h"
#include "include/core/SkData.h"
#include "include/core/SkDocument.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkStream.h"
#include "include/core/SkString.h"
#include "include/docs/SkPDFDocument.h"

#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

namespace {

class PDFDocument {
 public:
  explicit PDFDocument(const std::string& title) {
    SkPDF::Metadata metadata;
    metadata.fTitle = SkString(title.c_str());
    metadata.fCreator = SkString("tz-pixi-skia");
    fDoc = SkPDF::MakeDocument(&fStream, metadata);
  }

  SkCanvas* beginPage(SkScalar width, SkScalar height) {
    return fDoc ? fDoc->beginPage(width, height) : nullptr;
  }

  void endPage() {
    if (fDoc) fDoc->endPage();
  }

  void close() {
    if (fDoc) {
      fDoc->close();
      fDoc.reset();
    }
    fData = fStream.detachAsData();
  }

  val bytes() const {
    if (!fData) return val::null();
    return val(typed_memory_view(fData->size(), fData->bytes()));
  }

 private:
  SkDynamicMemoryWStream fStream;
  sk_sp<SkDocument> fDoc;
  sk_sp<SkData> fData;
};

PDFDocument* MakePDFDocument(std::string title) {
  return new PDFDocument(title);
}

}  // namespace

EMSCRIPTEN_BINDINGS(skia_pdf) {
  class_<PDFDocument>("PDFDocument")
      .function("beginPage", &PDFDocument::beginPage, allow_raw_pointers())
      .function("endPage", &PDFDocument::endPage)
      .function("close", &PDFDocument::close)
      .function("bytes", &PDFDocument::bytes);

  function("MakePDFDocument", &MakePDFDocument, allow_raw_pointers());
}
