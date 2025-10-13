"use client";
import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";

export default function ResizeImagePage() {
  const [image, setImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [mode, setMode] = useState<"stretch" | "extend">("stretch");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleResize = () => {
    if (!image || !width || !height) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = width;
      canvas.height = height;

      if (mode === "stretch") {
        // --- STANDARD RESIZE ---
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        // --- BACKGROUND EXTENSION MODE ---
        const w = img.width;
        const h = img.height;

        // Center position
        const x = (width - w) / 2;
        const y = (height - h) / 2;

        // Draw blurred edges on sides
        const extendSize = 40; // thickness of edge strips

        // Left strip
        ctx.drawImage(img, 0, 0, extendSize, h, x - extendSize, y, extendSize, h);
        // Right strip
        ctx.drawImage(img, w - extendSize, 0, extendSize, h, x + w, y, extendSize, h);
        // Top strip
        ctx.drawImage(img, 0, 0, w, extendSize, x, y - extendSize, w, extendSize);
        // Bottom strip
        ctx.drawImage(img, 0, h - extendSize, w, extendSize, x, y + h, w, extendSize);

        // Slight blur (simulated using globalAlpha layering)
        ctx.globalAlpha = 0.7;
        ctx.filter = "blur(20px)";
        ctx.drawImage(canvas, 0, 0);
        ctx.globalAlpha = 1.0;
        ctx.filter = "none";

        // Draw original image on top (centered)
        ctx.drawImage(img, x, y, w, h);
      }

      const resizedDataUrl = canvas.toDataURL("image/jpeg", 1.0);
      setResizedImage(resizedDataUrl);
    };
  };

  const handleDownload = () => {
    if (!resizedImage) return;
    const link = document.createElement("a");
    link.href = resizedImage;
    link.download = "resized-image.jpg";
    link.click();
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-6 text-center">
          Image Resizer
        </h1>

        <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-blue-200 w-full max-w-2xl flex flex-col items-center">
          {/* Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4 border border-blue-300 rounded-lg p-2 bg-blue-50 cursor-pointer text-blue-900"
          />

          {/* Mode Selector */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setMode("stretch")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === "stretch"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-900 hover:bg-blue-200"
              }`}
            >
              Stretch Image
            </button>
            <button
              onClick={() => setMode("extend")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                mode === "extend"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-900 hover:bg-blue-200"
              }`}
            >
              Extend Background
            </button>
          </div>

          {image && (
            <>
              <img
                src={image}
                alt="Uploaded"
                className="max-w-full max-h-80 rounded-lg border mb-4 shadow"
              />

              <div className="flex gap-4 mb-4">
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={width || ""}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="border border-blue-300 rounded-lg p-2 w-32 text-blue-900"
                />
                <input
                  type="number"
                  placeholder="Height (px)"
                  value={height || ""}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="border border-blue-300 rounded-lg p-2 w-32 text-blue-900"
                />
                <button
                  onClick={handleResize}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all"
                >
                  Resize
                </button>
              </div>
            </>
          )}

          {resizedImage && (
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-blue-900 font-semibold">Resized Image Preview</h2>
              <img
                src={resizedImage}
                alt="Resized"
                className="max-w-full max-h-80 rounded-lg border shadow"
              />
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all"
              >
                Download Resized Image
              </button>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    </>
  );
}