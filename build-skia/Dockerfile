FROM emscripten/emsdk:3.1.64

RUN apt-get update && apt-get install -y --no-install-recommends \
      git python3 python3-distutils curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# depot_tools (gn/ninja, git-sync-deps)
RUN git clone --depth 1 https://chromium.googlesource.com/chromium/tools/depot_tools.git
ENV PATH="/build/depot_tools:${PATH}"

ARG SKIA_REF=chrome/m120
RUN git clone --branch "${SKIA_REF}" --depth 1 https://skia.googlesource.com/skia.git \
    || git clone --depth 1 https://skia.googlesource.com/skia.git
WORKDIR /build/skia
RUN python3 tools/git-sync-deps

COPY canvaskit_pdf_bindings.cpp /build/skia/modules/canvaskit/
COPY build.sh /build/skia/build-pdf.sh
RUN chmod +x /build/skia/build-pdf.sh

RUN SKIA_DIR=/build/skia OUT_DIR=/artifacts /build/skia/build-pdf.sh

FROM scratch AS artifacts
COPY --from=0 /artifacts/ /
