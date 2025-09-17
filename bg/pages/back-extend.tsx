"use client";

import { useState, useRef, useEffect } from "react";

export default function EdgeExtendBackground() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const [padding, setPadding] = useState<number>(100);
  const [blur, setBlur] = useState<boolean>(false);
  const [edgeSize, setEdgeSize] = useState<number>(50);

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

  // Download
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = "extended-image.png";
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

    // Top & Bottom
    copyStrip(0, 0, img.width, stripH, padding, 0, img.width, padding);
    copyStrip(0, img.height - stripH, img.width, stripH, padding, canvas.height - padding, img.width, padding);

    // Left & Right
    copyStrip(0, 0, stripW, img.height, 0, padding, padding, img.height);
    copyStrip(img.width - stripW, 0, stripW, img.height, canvas.width - padding, padding, padding, img.height);

    // Corners
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

    // ---- Edge Strip Preview ----
    const edgeCanvas = edgeCanvasRef.current;
    const edgeCtx = edgeCanvas.getContext("2d");
    if (!edgeCtx) return;

    edgeCanvas.width = img.width + 2 * stripW;
    edgeCanvas.height = img.height + 2 * stripH;
    edgeCtx.clearRect(0, 0, edgeCanvas.width, edgeCanvas.height);

    // Top, Bottom, Left, Right & Corners
    edgeCtx.drawImage(img, 0, 0, img.width, stripH, stripW, 0, img.width, stripH);
    edgeCtx.drawImage(img, 0, img.height - stripH, img.width, stripH, stripW, edgeCanvas.height - stripH, img.width, stripH);
    edgeCtx.drawImage(img, 0, 0, stripW, img.height, 0, stripH, stripW, img.height);
    edgeCtx.drawImage(img, img.width - stripW, 0, stripW, img.height, edgeCanvas.width - stripW, stripH, stripW, img.height);

    edgeCtx.drawImage(img, 0, 0, stripW, stripH, 0, 0, stripW, stripH);
    edgeCtx.drawImage(img, img.width - stripW, 0, stripW, stripH, edgeCanvas.width - stripW, 0, stripW, stripH);
    edgeCtx.drawImage(img, 0, img.height - stripH, stripW, stripH, 0, edgeCanvas.height - stripH, stripW, stripH);
    edgeCtx.drawImage(
      img,
      img.width - stripW,
      img.height - stripH,
      stripW,
      stripH,
      edgeCanvas.width - stripW,
      edgeCanvas.height - stripH,
      stripW,
      stripH
    );
  };

  // Redraw on state changes
  useEffect(() => {
    redraw();
  }, [imgElement, padding, blur, edgeSize]);

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

            <button
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl mt-4"
            >
              Download Extended Image
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