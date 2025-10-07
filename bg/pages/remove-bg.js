import Header from "../components/Header";
import { useState, useRef, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function RemoveBgPage() {
  const [eraseMode, setEraseMode] = useState(false);
  const [restoreMode, setRestoreMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);

  const [inputImage, setInputImage] = useState(null);
  const [fgBlob, setFgBlob] = useState(null);
  const [bgOption, setBgOption] = useState("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const originalImageRef = useRef(null);

  // Redraw preview when background changes
  useEffect(() => {
    const drawPreview = async () => {
      if (!fgBlob || !canvasRef.current) return;
      const fgBitmap = await createImageBitmap(fgBlob);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = fgBitmap.width;
      canvas.height = fgBitmap.height;

      // Draw background
      if (bgOption === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgOption === "image" && bgFile) {
        const bgBitmap = await createImageBitmap(bgFile);
        ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(fgBitmap, 0, 0);
    };

    drawPreview();
  }, [fgBlob, bgOption, bgColor, bgFile]);

  // Handle brush drawing / restoring
  useEffect(() => {
    if (!fgBlob || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const handlePointerDown = (e) => {
      if (!eraseMode && !restoreMode) return;
      setIsDrawing(true);
      drawAt(e);
    };

    const handlePointerUp = () => setIsDrawing(false);

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      // Move visible circular brush cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = `${x - brushSize}px`;
        cursorRef.current.style.top = `${y - brushSize}px`;
      }

      if (!isDrawing) return;
      drawAt(e);
    };

    const drawAt = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2, false);
      ctx.clip();

      if (eraseMode) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill();
      } else if (restoreMode && originalImageRef.current) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(originalImageRef.current, 0, 0);
      }

      ctx.restore();
    };

    canvas.addEventListener("mousedown", handlePointerDown);
    canvas.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    canvas.addEventListener("touchstart", handlePointerDown);
    canvas.addEventListener("touchmove", handlePointerMove);
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      canvas.removeEventListener("mousedown", handlePointerDown);
      canvas.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);

      canvas.removeEventListener("touchstart", handlePointerDown);
      canvas.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [eraseMode, restoreMode, brushSize, fgBlob, isDrawing]);

  // Upload input
  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setFgBlob(null);
      setBgFile(null);
      setBgOption("transparent");
    }
  };

  const processImage = async () => {
    if (!inputImage) return alert("Please upload an image first.");
    setLoading(true);
    try {
      const blob = await removeBackground(inputImage);
      setFgBlob(blob);

      // Keep a copy for restore brush
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      img.onload = () => (originalImageRef.current = img);
    } catch (err) {
      alert("Image processing failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "output.png";
      a.click();
    }, "image/png");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center tracking-wide">
          Background Remover & Editor
        </h1>

        <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-xl border border-blue-200 border-opacity-30">
          <div className="flex flex-col mb-4">
            <label className="font-semibold text-blue-900 mb-2">Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="p-2 border rounded-lg border-blue-300 bg-white/60 focus:outline-none"
            />
          </div>

          {!fgBlob && inputImage && (
            <button
              onClick={processImage}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 font-semibold rounded-2xl shadow-md hover:opacity-90"
            >
              {loading ? "Processing..." : "Process Image"}
            </button>
          )}

          {fgBlob && (
            <>
              <div className="flex flex-col gap-3 mt-4">
                <label className="font-semibold text-blue-900">Background:</label>
                <select
                  value={bgOption}
                  onChange={(e) => setBgOption(e.target.value)}
                  className="p-2 border rounded-lg border-blue-300 bg-white/60"
                >
                  <option value="transparent">Transparent</option>
                  <option value="color">Solid Color</option>
                  <option value="image">Image</option>
                </select>

                {bgOption === "color" && (
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-20 h-10 border rounded-lg cursor-pointer border-blue-300"
                  />
                )}

                {bgOption === "image" && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBgFile(e.target.files[0])}
                    className="p-2 border rounded-lg border-blue-300 bg-white/60"
                  />
                )}
              </div>

              <div className="flex flex-col items-center gap-3 mt-6">
                <button
                  onClick={() => setShowEditor(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md"
                >
                  Open Eraser / Restore Editor
                </button>
                <button
                  onClick={downloadImage}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md"
                >
                  Download Image
                </button>
              </div>
            </>
          )}
        </div>

        {/* Editor Modal */}
        {showEditor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-6 shadow-2xl relative max-w-4xl w-full flex flex-col items-center">
              <button
                onClick={() => setShowEditor(false)}
                className="absolute top-3 right-3 text-red-600 text-xl font-bold"
              >
                ✕
              </button>

              <h2 className="text-2xl font-semibold text-blue-900 mb-4">Eraser / Restore Mode</h2>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    setEraseMode(!eraseMode);
                    setRestoreMode(false);
                  }}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    eraseMode ? "bg-red-500 text-white" : "bg-gray-300"
                  }`}
                >
                  {eraseMode ? "Erasing…" : "Erase Mode"}
                </button>
                <button
                  onClick={() => {
                    setRestoreMode(!restoreMode);
                    setEraseMode(false);
                  }}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    restoreMode ? "bg-green-500 text-white" : "bg-gray-300"
                  }`}
                >
                  {restoreMode ? "Restoring…" : "Restore Mode"}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <label className="font-medium text-blue-900">Brush Size:</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-40"
                />
                <span className="text-blue-900">{brushSize}px</span>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="rounded-2xl border border-blue-300 shadow-lg cursor-none"
                />
                <div
                  ref={cursorRef}
                  style={{
                    width: `${brushSize * 2}px`,
                    height: `${brushSize * 2}px`,
                    border: "2px solid rgba(0,0,0,0.3)",
                    borderRadius: "50%",
                    position: "absolute",
                    pointerEvents: "none",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}