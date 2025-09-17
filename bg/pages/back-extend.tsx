"use client";

import { useState, useRef, useEffect } from "react";

export default function EdgeExtendBackground() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const [padding, setPadding] = useState<number>(100);
  const [blur, setBlur] = useState<boolean>(false);
  const [edgeSize, setEdgeSize] = useState<number>(50);

  const [format, setFormat] = useState<"png" | "jpeg" | "jpg" | "webp">("png");
  const [quality, setQuality] = useState<number>(0.9); // for jpeg/webp
  const [estimatedSize, setEstimatedSize] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const edgeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image once
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      const img = new Image();
      img.src = URL.createObjectURL(e.target.files[0]);
      img.onload = () => {
        setImgElement(img);
        setImgDimensions({ width: img.width, height: img.height });
      };
    }
  };

  // Estimate file size and update preview
  const updateFileSize = () => {
    if (!canvasRef.current) return;
    let mimeType = "image/png";
    if (format === "jpeg" || format === "jpg") mimeType = "image/jpeg";
    if (format === "webp") mimeType = "image/webp";

    const dataUrl =
      mimeType === "image/png"
        ? canvasRef.current.toDataURL(mimeType)
        : canvasRef.current.toDataURL(mimeType, quality);

    const base64Length = dataUrl.length - (dataUrl.indexOf(",") + 1);
    const padding = (dataUrl.charAt(dataUrl.length - 2) === "=" ? 2 : dataUrl.charAt(dataUrl.length - 1) === "=" ? 1 : 0);
    const fileSizeBytes = base64Length * 0.75 - padding;
    const fileSizeKB = fileSizeBytes / 1024;
    const fileSizeMB = fileSizeKB / 1024;

    setEstimatedSize(fileSizeMB > 1 ? `${fileSizeMB.toFixed(2)} MB` : `${fileSizeKB.toFixed(1)} KB`);
  };

  // Download
  const handleDownload = () => {
    if (!canvasRef.current) return;

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
  };

  // Redraw function
  const redraw = () => {
    if (!imgElement || !canvasRef.current || !edgeCanvasRef.current) return;

    const img = imgElement;

    // ---- Main Extended Canvas ----
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width + padding * 2;
    canvas.height = img.height + padding * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const stripW = Math.min(edgeSize, img.width);
    const stripH = Math.min(edgeSize, img.height);

    const copyStrip = (
      sx: number, sy: number, sw: number, sh: number,
      dx: number, dy: number, dw: number, dh: number
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
    copyStrip(img.width - stripW, img.height - stripH, stripW, stripH, canvas.width - padding, canvas.height - padding, padding, padding);

    // Original image
    ctx.filter = blur ? "blur(10px)" : "none";
    ctx.drawImage(img, padding, padding);

    // ---- Edge Strip Preview ----
    const edgeCanvas = edgeCanvasRef.current;
    const edgeCtx = edgeCanvas.getContext("2d");
    if (!edgeCtx) return;

    edgeCanvas.width = img.width + 2 * stripW;
    edgeCanvas.height = img.height + 2 * stripH;
    edgeCtx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);

    edgeCtx.drawImage(img, 0, 0, img.width, stripH, stripW, 0, img.width, stripH);
    edgeCtx.drawImage(img, 0, img.height - stripH, img.width, stripH, stripW, edgeCanvas.height - stripH, img.width, stripH);
    edgeCtx.drawImage(img, 0, 0, stripW, img.height, 0, stripH, stripW, img.height);
    edgeCtx.drawImage(img, img.width - stripW, 0, stripW, img.height, edgeCanvas.width - stripW, stripH, stripW, img.height);
    edgeCtx.drawImage(img, 0, 0, stripW, stripH, 0, 0, stripW, stripH);
    edgeCtx.drawImage(img, img.width - stripW, 0, stripW, stripH, edgeCanvas.width - stripW, 0, stripW, stripH);
    edgeCtx.drawImage(img, 0, img.height - stripH, stripW, stripH, 0, edgeCanvas.height - stripH, stripW, stripH);
    edgeCtx.drawImage(img, img.width - stripW, img.height - stripH, stripW, stripH, edgeCanvas.width - stripW, edgeCanvas.height - stripH, stripW, stripH);

    updateFileSize();
  };

  useEffect(() => {
    redraw();
  }, [imgElement, padding, blur, edgeSize, format, quality]);

  const clarityNote = {
    png: "Lossless, best clarity, larger file.",
    jpeg: "Lossy compression, smaller file, slight quality drop.",
    jpg: "Same as JPEG, widely supported.",
    webp: "Good balance, modern browsers only.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6 animate-fadeIn">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center drop-shadow-lg tracking-wide animate-fadeIn">
        Edge Repeated Background Extender
      </h1>

      <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6">
        <div>
          <label className="font-semibold text-blue-900">Upload Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2 p-2 border rounded-lg w-full" />
        </div>

        {imgElement && (
          <>
            <div>
              <label className="font-semibold text-blue-900">Background Padding: {padding}px</label>
              <input type="range" min={10} max={1000} value={padding} onChange={(e) => setPadding(+e.target.value)} className="w-full" />
            </div>

            <div>
              <label className="font-semibold text-blue-900">Edge Strip Size: {edgeSize}px</label>
              <input
                type="range"
                min={10}
                max={imgDimensions ? Math.min(300, Math.min(imgDimensions.width, imgDimensions.height)) : 300}
                value={edgeSize}
                onChange={(e) => setEdgeSize(+e.target.value)}
                className="w-full"
              />
            </div>

            <label className="flex items-center gap-2 text-blue-900 font-semibold">
              <input type="checkbox" checked={blur} onChange={() => setBlur(!blur)} className="accent-blue-600" />
              Blur Background
            </label>

            {/* Export Options */}
            <div>
              <label className="font-semibold text-blue-900">Export Format:</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="p-2 border rounded-lg w-full mt-2">
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            {(format === "jpeg" || format === "jpg" || format === "webp") && (
              <div>
                <label className="font-semibold text-blue-900">Quality: {Math.round(quality * 100)}%</label>
                <input type="range" min={10} max={100} value={quality * 100} onChange={(e) => setQuality(+e.target.value / 100)} className="w-full" />
              </div>
            )}

            <div className="text-sm text-blue-900 bg-white/60 rounded-lg p-3 shadow-inner">
              <p><strong>Final Size:</strong> {imgDimensions ? imgDimensions.width + 2 * padding : 0} × {imgDimensions ? imgDimensions.height + 2 * padding : 0} px</p>
              <p><strong>Estimated File:</strong> {estimatedSize}</p>
              <p><strong>Clarity:</strong> {clarityNote[format]}</p>
            </div>

            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl mt-4"
            >
              Download as {format.toUpperCase()}
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
  );
}