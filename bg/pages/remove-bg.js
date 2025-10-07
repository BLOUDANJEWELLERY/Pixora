import Header from "../components/Header";
import { useState, useRef, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function RemoveBgPage() {
  
  const [eraseMode, setEraseMode] = useState(false);
const [isErasing, setIsErasing] = useState(false);
const [brushSize, setBrushSize] = useState(20);
  
  
  const [inputImage, setInputImage] = useState(null);
  const [fgBlob, setFgBlob] = useState(null);
  const [bgOption, setBgOption] = useState("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);

  // Live preview redraw
  useEffect(() => {
    const drawPreview = async () => {
      if (!fgBlob || !canvasRef.current) return;

      const fgBitmap = await createImageBitmap(fgBlob);
      const canvas = canvasRef.current;
      canvas.width = fgBitmap.width;
      canvas.height = fgBitmap.height;
      const ctx = canvas.getContext("2d");

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



useEffect(() => {
  if (!fgBlob || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  const handlePointerDown = (e) => {
    if (!eraseMode) return;
    setIsErasing(true);
    eraseAt(e);
  };

  const handlePointerUp = () => {
    if (!eraseMode) return;
    setIsErasing(false);
  };

  const handlePointerMove = (e) => {
    if (!eraseMode || !isErasing) return;
    eraseAt(e);
  };

  function eraseAt(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.save();
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.arc(x, y, brushSize, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
  }

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
}, [eraseMode, isErasing, brushSize, fgBlob]);


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
    if (!inputImage) return alert("Please upload an image");

    setLoading(true);
    try {
      const blob = await removeBackground(inputImage);
      setFgBlob(blob);
    } catch (err) {
      console.error(err);
      alert("Failed to process image: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBgFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setBgFile(file);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.png";
      a.click();
    }, "image/png");
  };

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6 animate-fadeIn">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center drop-shadow-lg tracking-wide animate-fadeIn">
        Background Remover & Replacer
      </h1>

      {/* Glassmorphic Upload Card */}
      <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30 transition-transform transform hover:scale-[1.02] duration-300">
        <div className="flex flex-col">
          <label className="mb-2 font-semibold text-blue-900">Upload Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
          />
        </div>

        {!fgBlob && inputImage && (
          <button
            onClick={processImage}
            disabled={loading}
            className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Process Image"}
          </button>
        )}

        {/* Show background options only after processing */}
        {fgBlob && (
          <>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-blue-900">Background Option:</label>
              <select
                value={bgOption}
                onChange={(e) => setBgOption(e.target.value)}
                className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
              >
                <option value="transparent">Transparent</option>
                <option value="color">Solid Color</option>
                <option value="image">Image</option>
              </select>
            </div>

            {bgOption === "color" && (
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-blue-900">Pick Background Color:</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-20 h-10 border rounded-lg cursor-pointer border-blue-300"
                />
              </div>
            )}

            {bgOption === "image" && (
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-blue-900">Upload Background Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBgFileChange}
                  className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
                />
              </div>
            )}

            <button
              onClick={downloadImage}
              className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] mt-4"
            >
              Download Image
            </button>
            
            
            <div className="mt-4 flex flex-col items-center gap-3">
  <button
    onClick={() => setEraseMode(!eraseMode)}
    className={`py-2 px-6 rounded-xl font-semibold shadow-md transition-all duration-300 ${
      eraseMode
        ? "bg-red-500 hover:bg-red-600 text-white"
        : "bg-green-500 hover:bg-green-600 text-white"
    }`}
  >
    {eraseMode ? "Disable Erase Mode" : "Enable Erase Mode"}
  </button>

  {eraseMode && (
    <div className="flex items-center gap-2">
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
  )}
</div>


          </>
        )}
      </div>

      {/* Preview Card */}
      {fgBlob && (
        <div className="mt-10 bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-6 w-full max-w-xl flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 drop-shadow-sm">Live Preview:</h2>
          <canvas ref={canvasRef} className="rounded-2xl border border-blue-300 max-w-full shadow-md" />
        </div>
      )}

      {/* Fade-in Animation */}
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
    </>
  );
}