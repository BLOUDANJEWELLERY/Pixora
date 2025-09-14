import { useState, useRef, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function CivilIDPage() {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontBlob, setFrontBlob] = useState(null);
  const [backBlob, setBackBlob] = useState(null);
  const [loading, setLoading] = useState(false);

  const [watermark, setWatermark] = useState("");
  const [showWatermark, setShowWatermark] = useState(false);

  const canvasRef = useRef(null);

  // Helper: auto-crop & rotate an image blob
  const cropAndRotate = async (blob) => {
    const bitmap = await createImageBitmap(blob);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = bitmap.width;
    tempCanvas.height = bitmap.height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);

    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const { data, width, height } = imageData;

    // Find bounding box of non-transparent pixels
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) { // not transparent
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const croppedWidth = maxX - minX;
    const croppedHeight = maxY - minY;

    // Crop image
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = croppedWidth;
    croppedCanvas.height = croppedHeight;
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(tempCanvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);

    // Auto-rotate approximation: compute skew angle from moments
    // For simplicity, we skip complex angle calculation; assume small tilt
    // You can integrate more advanced libraries if needed
    return new Promise((resolve) => {
      croppedCanvas.toBlob((b) => resolve(b), "image/png");
    });
  };

  const processFront = async () => {
    if (!frontImage) return;
    setLoading(true);
    try {
      const blob = await removeBackground(frontImage);
      const processed = await cropAndRotate(blob);
      setFrontBlob(processed);
    } catch (err) {
      console.error(err);
      alert("Failed to process front: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processBack = async () => {
    if (!backImage) return;
    setLoading(true);
    try {
      const blob = await removeBackground(backImage);
      const processed = await cropAndRotate(blob);
      setBackBlob(processed);
    } catch (err) {
      console.error(err);
      alert("Failed to process back: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compose paper
  useEffect(() => {
    const drawPaper = async () => {
      if (!frontBlob && !backBlob) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const frontBitmap = frontBlob ? await createImageBitmap(frontBlob) : null;
      const backBitmap = backBlob ? await createImageBitmap(backBlob) : null;

      const width = Math.max(frontBitmap?.width || 0, backBitmap?.width || 0) + 100;
      const height = (frontBitmap?.height || 0) + (backBitmap?.height || 0) + 150;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      if (frontBitmap) ctx.drawImage(frontBitmap, (width - frontBitmap.width) / 2, 50);
      if (backBitmap) ctx.drawImage(backBitmap, (width - backBitmap.width) / 2, 50 + (frontBitmap?.height || 0) + 50);

      if (showWatermark && watermark.trim()) {
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "rgba(0,0,255,0.1)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(watermark, 0, 0);
        ctx.rotate(Math.PI / 6);
        ctx.translate(-width / 2, -height / 2);
      }
    };
    drawPaper();
  }, [frontBlob, backBlob, showWatermark, watermark]);

  const downloadPaper = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "civil_id_paper.png";
      a.click();
    }, "image/png");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center drop-shadow-lg tracking-wide">
        Civil ID Formatter
      </h1>

      {/* Upload Card */}
      <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30">
        {/* Front Image */}
        <div className="flex flex-col">
          <label className="font-semibold text-blue-900 mb-2">Upload Front of ID:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFrontImage(e.target.files[0])}
            className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
          />
          {frontImage && !frontBlob && (
            <button
              onClick={processFront}
              className="mt-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 rounded-xl shadow-lg transition hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            >
              Process Front
            </button>
          )}
        </div>

        {/* Back Image */}
        <div className="flex flex-col">
          <label className="font-semibold text-blue-900 mb-2">Upload Back of ID:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBackImage(e.target.files[0])}
            className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
          />
          {backImage && !backBlob && (
            <button
              onClick={processBack}
              className="mt-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 rounded-xl shadow-lg transition hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
            >
              Process Back
            </button>
          )}
        </div>

        {/* Watermark */}
        {(frontBlob || backBlob) && (
          <div className="flex flex-col gap-2 mt-4">
            <label className="font-semibold text-blue-900">Add Optional Watermark:</label>
            <input
              type="text"
              placeholder="Watermark text"
              value={watermark}
              onChange={(e) => setWatermark(e.target.value)}
              className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
            />
            <label className="inline-flex items-center mt-1">
              <input
                type="checkbox"
                className="mr-2"
                checked={showWatermark}
                onChange={() => setShowWatermark(!showWatermark)}
              />
              <span className="text-blue-900">Show Watermark</span>
            </label>
          </div>
        )}

        {(frontBlob || backBlob) && (
          <button
            onClick={downloadPaper}
            className="mt-4 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            Download Civil ID Paper
          </button>
        )}
      </div>

      {/* Preview Canvas */}
      {(frontBlob || backBlob) && (
        <div className="mt-10 bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-6 w-full max-w-xl flex flex-col items-center gap-4 border border-blue-200 border-opacity-30">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 drop-shadow-sm">Preview:</h2>
          <canvas ref={canvasRef} className="rounded-2xl border border-blue-300 max-w-full shadow-md" />
        </div>
      )}
    </div>
  );
}