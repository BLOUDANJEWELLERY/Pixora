import Header from "../components/Header";
import { useState, useRef, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState(null);
  const [fgBlob, setFgBlob] = useState(null);
  const [bgOption, setBgOption] = useState("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);

  const canvasRef = useRef(null);
  const originalFgBitmapRef = useRef(null);
  const eraseDataRef = useRef([]);

  // Live preview redraw
  useEffect(() => {
    const drawPreview = async () => {
      if (!fgBlob || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Store original bitmap if not already stored
      if (!originalFgBitmapRef.current) {
        originalFgBitmapRef.current = await createImageBitmap(fgBlob);
        canvas.width = originalFgBitmapRef.current.width;
        canvas.height = originalFgBitmapRef.current.height;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      if (bgOption === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgOption === "image" && bgFile) {
        const bgBitmap = await createImageBitmap(bgFile);
        ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height);
      }
      // For transparent background, we don't draw anything

      // Draw foreground image
      ctx.drawImage(originalFgBitmapRef.current, 0, 0);

      // Apply erase operations
      applyEraseOperations(ctx);
    };

    drawPreview();
  }, [fgBlob, bgOption, bgColor, bgFile]);

  // Apply all erase operations to the canvas
  const applyEraseOperations = (ctx) => {
    if (!ctx || eraseDataRef.current.length === 0) return;

    ctx.globalCompositeOperation = "destination-out";
    eraseDataRef.current.forEach(erase => {
      ctx.beginPath();
      ctx.arc(erase.x, erase.y, erase.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setFgBlob(null);
      setBgFile(null);
      setBgOption("transparent");
      originalFgBitmapRef.current = null;
      eraseDataRef.current = [];
    }
  };

  const processImage = async () => {
    if (!inputImage) return alert("Please upload an image");

    setLoading(true);
    try {
      const blob = await removeBackground(inputImage);
      setFgBlob(blob);
      eraseDataRef.current = []; // Reset erase data
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

  // Handle canvas click for erasing
  const handleCanvasClick = (e) => {
    if (!isErasing || !canvasRef.current || !fgBlob) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Add erase operation to data
    eraseDataRef.current.push({
      x,
      y,
      size: brushSize
    });

    // Redraw canvas to show the erase
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  };

  // Handle mouse move for continuous erasing
  const handleCanvasMouseMove = (e) => {
    if (!isErasing || !e.buttons || !canvasRef.current || !fgBlob) return;
    handleCanvasClick(e);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    // Create a temporary canvas to apply all operations
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;

    // Draw background
    if (bgOption === "color") {
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    } else if (bgOption === "image" && bgFile) {
      // For background image, we need to handle this differently
      // Since we can't directly draw the blob, we'll use the current canvas
      tempCtx.drawImage(canvasRef.current, 0, 0);
    } else {
      // Transparent background - draw foreground with erasures
      if (originalFgBitmapRef.current) {
        tempCtx.drawImage(originalFgBitmapRef.current, 0, 0);
        applyEraseOperations(tempCtx);
      }
    }

    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const resetErase = () => {
    eraseDataRef.current = [];
    if (canvasRef.current && originalFgBitmapRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw everything
      if (bgOption === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgOption === "image" && bgFile) {
        // Background image will be redrawn in the next effect
      }
      ctx.drawImage(originalFgBitmapRef.current, 0, 0);
    }
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

          {/* Show background options and erase tools only after processing */}
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

              {/* Erase Tools */}
              <div className="flex flex-col gap-4 p-4 bg-white/30 rounded-xl border border-blue-200">
                <label className="font-semibold text-blue-900">Manual Erase Tool:</label>
                
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => setIsErasing(!isErasing)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      isErasing 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isErasing ? 'Erasing...' : 'Enable Erase'}
                  </button>

                  <button
                    onClick={resetErase}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Reset Erase
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-blue-900">Brush Size: {brushSize}px</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {isErasing && (
                  <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded-lg">
                    Click and drag on the image below to erase areas
                  </p>
                )}
              </div>

              <button
                onClick={downloadImage}
                className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] mt-4"
              >
                Download Image
              </button>
            </>
          )}
        </div>

        {/* Preview Card */}
        {fgBlob && (
          <div className="mt-10 bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-6 w-full max-w-xl flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 animate-fadeIn">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 drop-shadow-sm">Live Preview:</h2>
            <div className="relative">
              <canvas 
                ref={canvasRef} 
                className={`rounded-2xl border-2 max-w-full shadow-md ${
                  isErasing ? 'cursor-crosshair border-red-400' : 'border-blue-300'
                }`}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
              />
              {isErasing && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  Erase Mode Active
                </div>
              )}
            </div>
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