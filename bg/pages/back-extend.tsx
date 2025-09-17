"use client";

import { useState, useEffect, useRef } from "react";

export default function EdgeExtendBackground() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [padding, setPadding] = useState<number>(100);
  const [blur, setBlur] = useState<boolean>(false);
  const [edgeSize, setEdgeSize] = useState<number>(50);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!imageFile || !canvasRef.current) return;

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);

    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });

      const canvas = canvasRef.current;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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

      // Apply blur to background edges if selected
      ctx.filter = blur ? "blur(10px)" : "none";

      // Top and bottom
      copyStrip(0, 0, img.width, stripH, padding, 0, img.width, padding); // top
      copyStrip(0, img.height - stripH, img.width, stripH, padding, canvas.height - padding, img.width, padding); // bottom

      // Left and right
      copyStrip(0, 0, stripW, img.height, 0, padding, stripW, img.height); // left
      copyStrip(img.width - stripW, 0, stripW, img.height, canvas.width - padding, padding, stripW, img.height); // right

      // Corners
      copyStrip(0, 0, stripW, stripH, 0, 0, stripW, stripH); // top-left
      copyStrip(img.width - stripW, 0, stripW, stripH, canvas.width - padding, 0, stripW, stripH); // top-right
      copyStrip(0, img.height - stripH, stripW, stripH, 0, canvas.height - padding, stripW, stripH); // bottom-left
      copyStrip(img.width - stripW, img.height - stripH, stripW, stripH, canvas.width - padding, canvas.height - padding, stripW, stripH); // bottom-right

      // Reset filter for main image
      ctx.filter = "none";
      ctx.drawImage(img, padding, padding);

      setResult(canvas.toDataURL("image/png"));
    };
  }, [imageFile, padding, blur, edgeSize]);

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = "extended-image.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6 animate-fadeIn">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center drop-shadow-lg tracking-wide animate-fadeIn">
        Edge Repeated Background Extender
      </h1>

      <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30 transition-transform transform hover:scale-[1.02] duration-300">
        <div className="flex flex-col">
          <label className="mb-2 font-semibold text-blue-900">Upload Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
          />
        </div>

        {imageFile && (
          <>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-blue-900">Background Padding: {padding}px</label>
              <input
                type="range"
                min={10}
                max={1000}
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-semibold text-blue-900">Edge Strip Size: {edgeSize}px</label>
              <input
                type="range"
                min={10}
                max={imgDimensions ? Math.min(300, Math.min(imgDimensions.width, imgDimensions.height)) : 300}
                value={edgeSize}
                onChange={(e) => setEdgeSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={blur}
                onChange={() => setBlur(!blur)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="font-semibold text-blue-900">Blur Background</span>
            </div>

            <button
              onClick={handleDownload}
              className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] mt-4"
            >
              Download Extended Image
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="mt-10 bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-6 w-full max-w-xl flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 drop-shadow-sm">Live Preview:</h2>
          <canvas ref={canvasRef} className="rounded-2xl border border-blue-300 max-w-full shadow-md" />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease forwards;
        }
      `}</style>
    </div>
  );
}