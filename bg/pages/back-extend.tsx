// pages/back-extend.tsx
"use client";
import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";
import Header from "../components/Header";

type ExportFormat = "png" | "jpeg" | "jpg" | "webp";

export default function EdgeExtendBackground() {
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const [padding, setPadding] = useState<number>(100);
  const [blur] = useState<boolean>(false);
  const [edgeSize, setEdgeSize] = useState<number>(50);

  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<number>(0.9);
  const [estimatedSize, setEstimatedSize] = useState<string>("");

  const [downloading, setDownloading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const edgeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const img = new Image();
      img.src = URL.createObjectURL(e.target.files[0]);
      img.onload = () => {
        setImgElement(img);
        setImgDimensions({ width: img.width, height: img.height });
      };
    }
  };

  // Estimate file size
  const updateFileSize = useCallback(() => {
    if (!canvasRef.current) return;
    let mimeType = "image/png";
    if (format === "jpeg" || format === "jpg") mimeType = "image/jpeg";
    if (format === "webp") mimeType = "image/webp";

    const dataUrl =
      mimeType === "image/png"
        ? canvasRef.current.toDataURL(mimeType)
        : canvasRef.current.toDataURL(mimeType, quality);

    const base64Length = dataUrl.length - (dataUrl.indexOf(",") + 1);
    const paddingBytes =
      dataUrl.charAt(dataUrl.length - 2) === "="
        ? 2
        : dataUrl.charAt(dataUrl.length - 1) === "="
        ? 1
        : 0;
    const fileSizeBytes = base64Length * 0.75 - paddingBytes;
    const fileSizeKB = fileSizeBytes / 1024;
    const fileSizeMB = fileSizeKB / 1024;

    setEstimatedSize(fileSizeMB > 1 ? `${fileSizeMB.toFixed(2)} MB` : `${fileSizeKB.toFixed(1)} KB`);
  }, [format, quality]);

  // Download
  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setDownloading(true);

    let mimeType = "image/png";
    if (format === "jpeg" || format === "jpg") mimeType = "image/jpeg";
    if (format === "webp") mimeType = "image/webp";

    const link = document.createElement("a");
    link.href =
      mimeType === "image/png"
        ? canvasRef.current.toDataURL(mimeType)
        : canvasRef.current.toDataURL(mimeType, quality);

    link.download = `extended-image.${format}`;
    link.click();

    setTimeout(() => setDownloading(false), 1500);
  };

  // Redraw
  const redraw = useCallback(() => {
    if (!imgElement || !canvasRef.current || !edgeCanvasRef.current) return;

    const img = imgElement;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width + padding * 2;
    canvas.height = img.height + padding * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Edges + corners
    copyStrip(0, 0, img.width, stripH, padding, 0, img.width, padding);
    copyStrip(0, img.height - stripH, img.width, stripH, padding, canvas.height - padding, img.width, padding);
    copyStrip(0, 0, stripW, img.height, 0, padding, padding, img.height);
    copyStrip(img.width - stripW, 0, stripW, img.height, canvas.width - padding, padding, padding, img.height);
    copyStrip(0, 0, stripW, stripH, 0, 0, padding, padding);
    copyStrip(img.width - stripW, 0, stripW, stripH, canvas.width - padding, 0, padding, padding);
    copyStrip(0, img.height - stripH, stripW, stripH, 0, canvas.height - padding, padding, padding);
    copyStrip(
      img.width - stripW,
      img.height - stripH,
      stripW,
      stripH,
      canvas.width - padding,
      canvas.height - padding,
      padding,
      padding
    );

    // Original image
    ctx.filter = blur ? "blur(10px)" : "none";
    ctx.drawImage(img, padding, padding);

    // Edge strip preview
    const edgeCanvas = edgeCanvasRef.current;
    const edgeCtx = edgeCanvas.getContext("2d");
    if (!edgeCtx) return;

    edgeCanvas.width = img.width + 2 * stripW;
    edgeCanvas.height = img.height + 2 * stripH;
    edgeCtx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);

    edgeCtx.drawImage(img, 0, 0, img.width, stripH, stripW, 0, img.width, stripH);
    edgeCtx.drawImage(
      img,
      0,
      img.height - stripH,
      img.width,
      stripH,
      stripW,
      edgeCanvas.height - stripH,
      img.width,
      stripH
    );
    edgeCtx.drawImage(img, 0, 0, stripW, img.height, 0, stripH, stripW, img.height);
    edgeCtx.drawImage(
      img,
      img.width - stripW,
      0,
      stripW,
      img.height,
      edgeCanvas.width - stripW,
      stripH,
      stripW,
      img.height
    );

    updateFileSize();
  }, [imgElement, padding, blur, edgeSize, updateFileSize]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const clarityNote: Record<ExportFormat, string> = {
    png: "Lossless, best clarity, larger file.",
    jpeg: "Lossy compression, smaller file, slight quality drop.",
    jpg: "Same as JPEG, widely supported.",
    webp: "Good balance, modern browsers only.",
  };

  return (
<>
<Header />
      <Head>
        {/* Page title */}
        <title>Pixora | Background Extender</title>

        {/* Favicon */}
        <link rel="icon" href="/favicon.PNG" />

        {/* App logo for mobile/Apple devices */}
        <link rel="apple-touch-icon" href="/favicon.PNG" />

        {/* Meta description for SEO */}
        <meta
          name="description"
          content="Extend your image background now"
        />
</Head>
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-10 text-center">
        Edge Repeated Background Extender
      </h1>

      <div className="bg-white/40 shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6">
        <div>
          <label className="font-semibold text-blue-900">Upload Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-2 p-2 border rounded-lg w-full"
          />
        </div>

        {imgElement && (
          <>
            <div>
              <label className="font-semibold text-blue-900">
                Background Padding: {padding}px
              </label>
              <input
                type="range"
                min={10}
                max={1000}
                value={padding}
                onChange={(e) => setPadding(+e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-semibold text-blue-900">
                Edge Strip Size: {edgeSize}px
              </label>
              <input
                type="range"
                min={1}
                max={
                  imgDimensions
                    ? Math.min(300, Math.min(imgDimensions.width, imgDimensions.height))
                    : 300
                }
                value={edgeSize}
                onChange={(e) => setEdgeSize(+e.target.value)}
                className="w-full"
              />
            </div>

            {/* Export Options */}
            <div>
              <label className="font-semibold text-blue-900">Export Format:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="p-2 border rounded-lg w-full mt-2"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            {(format === "jpeg" || format === "jpg" || format === "webp") && (
              <div>
                <label className="font-semibold text-blue-900">
                  Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality * 100}
                  onChange={(e) => setQuality(+e.target.value / 100)}
                  className="w-full"
                />
              </div>
            )}

            <div className="text-sm text-blue-900 bg-white/60 rounded-lg p-3 shadow-inner">
              <p>
                <strong>Final Size:</strong>{" "}
                {imgDimensions ? imgDimensions.width + 2 * padding : 0} ×{" "}
                {imgDimensions ? imgDimensions.height + 2 * padding : 0} px
              </p>
              <p>
                <strong>Estimated File:</strong> {estimatedSize}
              </p>
              <p>
                <strong>Clarity:</strong> {clarityNote[format]}
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`${
                downloading
                  ? "bg-gray-400 cursor-wait"
                  : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
              } text-white font-bold py-3 rounded-2xl shadow-xl mt-4 transition`}
            >
              {downloading ? "Downloading..." : `Download as ${format.toUpperCase()}`}
            </button>
          </>
        )}
      </div>

      {imgElement && (
        <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-xl">
          <div className="bg-white/40 p-6 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-semibold text-blue-900">Live Preview</h2>
            <canvas ref={canvasRef} className="rounded-2xl border border-blue-300 max-w-full mt-4" />
          </div>

          <div className="bg-white/40 p-6 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-semibold text-blue-900">Edge Strip Preview</h2>
            <canvas ref={edgeCanvasRef} className="rounded-2xl border border-blue-300 max-w-full mt-4" />
          </div>
        </div>
      )}
    </div>
</>
  );
}