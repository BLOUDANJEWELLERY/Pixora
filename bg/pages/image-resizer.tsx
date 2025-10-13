"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import Header from "../components/Header";

export default function ImageResizer() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [mode, setMode] = useState<"stretch" | "extend">("stretch");
  const [edgeSize, setEdgeSize] = useState<number>(50);
  const [resized, setResized] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image and auto-fill dimensions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = url;
  };

  // Core resizing logic
  const handleResize = useCallback(() => {
    if (!image) return;

    const img = new Image();
    img.src = URL.createObjectURL(image);
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (mode === "stretch") {
        // Normal stretch mode
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        // Background extension mode
        const targetW = Math.max(width, img.width);
        const targetH = Math.max(height, img.height);
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.clearRect(0, 0, targetW, targetH);

        const stripW = Math.min(edgeSize, img.width);
        const stripH = Math.min(edgeSize, img.height);

        const copyStrip = (
          sx: number,
          sy: number,
          sw: number,
          sh: number,
          dx: number,
          dy: number,
          dw: number,
          dh: number
        ) => {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = sw;
          tempCanvas.height = sh;
          const tctx = tempCanvas.getContext("2d");
          if (!tctx) return;
          tctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
          ctx.drawImage(tempCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
        };

        // Edges + corners (like your back-extend system)
        copyStrip(0, 0, img.width, stripH, 0, 0, img.width, stripH); // Top
        copyStrip(0, img.height - stripH, img.width, stripH, 0, targetH - stripH, img.width, stripH); // Bottom
        copyStrip(0, 0, stripW, img.height, 0, 0, stripW, img.height); // Left
        copyStrip(img.width - stripW, 0, stripW, img.height, targetW - stripW, 0, stripW, img.height); // Right

        // Fill background edges if extended beyond original
        if (targetW > img.width || targetH > img.height) {
          ctx.fillStyle = "#f0f0f0";
          ctx.fillRect(0, 0, targetW, targetH);
        }

        // Center original image
        const offsetX = (targetW - img.width) / 2;
        const offsetY = (targetH - img.height) / 2;
        ctx.drawImage(img, offsetX, offsetY);
      }

      const dataUrl = canvas.toDataURL("image/png");
      setResized(dataUrl);
    };
  }, [image, mode, width, height, edgeSize]);

  const handleDownload = () => {
    if (!resized) return;
    const a = document.createElement("a");
    a.href = resized;
    a.download = "resized-image.png";
    a.click();
  };

  useEffect(() => {
    if (image) handleResize();
  }, [mode, width, height, edgeSize]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-lg">
          Smart Image Resizer
        </h1>

        <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-blue-200 border-opacity-30 flex flex-col items-center w-full max-w-md gap-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-blue-900 cursor-pointer"
          />

          {preview && (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />

              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-blue-900">Width</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>

                <div>
                  <label className="text-sm text-blue-900">Height</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>
              </div>

              {(width !== originalWidth || height !== originalHeight) && (
                <div className="flex flex-col items-center gap-3 mt-4">
                  <label className="text-blue-900 font-semibold">
                    Resize Mode:
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setMode("stretch")}
                      className={`px-4 py-2 rounded-xl border ${
                        mode === "stretch"
                          ? "bg-blue-700 text-white"
                          : "bg-white/60 text-blue-900"
                      } transition`}
                    >
                      Stretch Image
                    </button>
                    <button
                      onClick={() => setMode("extend")}
                      className={`px-4 py-2 rounded-xl border ${
                        mode === "extend"
                          ? "bg-blue-700 text-white"
                          : "bg-white/60 text-blue-900"
                      } transition`}
                    >
                      Extend Background
                    </button>
                  </div>

                  {mode === "extend" && (
                    <div className="w-full mt-2">
                      <label className="text-sm text-blue-900">
                        Edge Strip Size: {edgeSize}px
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={300}
                        value={edgeSize}
                        onChange={(e) => setEdgeSize(+e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {resized && (
                <div className="flex flex-col items-center gap-4 mt-6">
                  <canvas
                    ref={canvasRef}
                    className="rounded-2xl border border-blue-300 max-w-full"
                    style={{ display: "none" }}
                  />
                  <img
                    src={resized}
                    alt="Resized"
                    className="w-48 h-48 object-contain rounded-xl border border-blue-200"
                  />
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all"
                  >
                    Download Resized Image
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-blue-900 text-sm mt-12">
          Resize, stretch, or extend — your choice, your control.
        </p>
      </div>
    </>
  );
}