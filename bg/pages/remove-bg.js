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
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const originalFgBitmapRef = useRef(null);
  const eraseDataRef = useRef([]);
  const lastTouchRef = useRef(null);

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
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const processImage = async () => {
    if (!inputImage) return alert("Please upload an image");

    setLoading(true);
    try {
      const blob = await removeBackground(inputImage);
      setFgBlob(blob);
      eraseDataRef.current = []; // Reset erase data
      setZoom(1);
      setPosition({ x: 0, y: 0 });
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

  // Get coordinates from event (handles both mouse and touch)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return null;

    const rect = container.getBoundingClientRect();
    
    let clientX, clientY;
    
    if (e.touches) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Adjust for zoom and position
    const x = ((clientX - rect.left) / zoom) - (position.x / zoom);
    const y = ((clientY - rect.top) / zoom) - (position.y / zoom);

    return { x, y };
  };

  // Handle erase start
  const handleEraseStart = (e) => {
    if (!isErasing || !canvasRef.current || !fgBlob) return;
    
    // Prevent default to avoid scrolling
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    // Add erase operation to data
    eraseDataRef.current.push({
      x: coords.x,
      y: coords.y,
      size: brushSize
    });

    // Apply erase to canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Store last touch for continuous erasing
    if (e.touches) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Handle continuous erasing
  const handleEraseMove = (e) => {
    if (!isErasing || !canvasRef.current || !fgBlob) return;
    
    // Prevent default to avoid scrolling
    e.preventDefault();
    e.stopPropagation();

    const coords = getCoordinates(e);
    if (!coords) return;

    // Add erase operation to data
    eraseDataRef.current.push({
      x: coords.x,
      y: coords.y,
      size: brushSize
    });

    // Apply erase to canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over");

    // Update last touch
    if (e.touches) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Handle panning (image movement)
  const handlePanStart = (e) => {
    if (isErasing) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    if (e.touches) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      lastTouchRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanMove = (e) => {
    if (!isDragging || isErasing) return;
    
    e.preventDefault();
    
    let clientX, clientY;
    
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (lastTouchRef.current) {
      const deltaX = clientX - lastTouchRef.current.x;
      const deltaY = clientY - lastTouchRef.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      lastTouchRef.current = { x: clientX, y: clientY };
    }
  };

  const handlePanEnd = () => {
    setIsDragging(false);
    lastTouchRef.current = null;
  };

  // Zoom functions
  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
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
                
                <div className="flex gap-4 items-center flex-wrap">
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

                {/* Zoom Controls */}
                <div className="flex flex-col gap-2">
                  <label className="text-blue-900">Zoom: {Math.round(zoom * 100)}%</label>
                  <div className="flex gap-2">
                    <button
                      onClick={zoomOut}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
                    >
                      Zoom Out
                    </button>
                    <button
                      onClick={resetView}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Reset View
                    </button>
                    <button
                      onClick={zoomIn}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
                    >
                      Zoom In
                    </button>
                  </div>
                </div>

                {isErasing && (
                  <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded-lg">
                    {window.innerWidth < 768 
                      ? "Touch and drag on the image to erase areas" 
                      : "Click and drag on the image to erase areas"}
                  </p>
                )}

                {!isErasing && (
                  <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded-lg">
                    {window.innerWidth < 768 
                      ? "Touch and drag to pan the image (when not erasing)" 
                      : "Click and drag to pan the image (when not erasing)"}
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
            <div 
              ref={containerRef}
              className="relative overflow-hidden rounded-2xl border-2 max-w-full shadow-md bg-gray-100"
              style={{ 
                cursor: isErasing ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
                touchAction: 'none' // This prevents browser handling of touch gestures
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: '0 0',
                  width: '100%',
                  height: '100%'
                }}
              >
                <canvas 
                  ref={canvasRef} 
                  className={`block ${isErasing ? 'border-red-400' : 'border-blue-300'}`}
                  // Mouse events
                  onMouseDown={isErasing ? handleEraseStart : handlePanStart}
                  onMouseMove={isErasing ? handleEraseMove : handlePanMove}
                  onMouseUp={handlePanEnd}
                  onMouseLeave={handlePanEnd}
                  // Touch events
                  onTouchStart={isErasing ? handleEraseStart : handlePanStart}
                  onTouchMove={isErasing ? handleEraseMove : handlePanMove}
                  onTouchEnd={handlePanEnd}
                  onTouchCancel={handlePanEnd}
                />
              </div>
              {isErasing && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  Erase Mode Active
                </div>
              )}
              {zoom !== 1 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Zoom: {Math.round(zoom * 100)}%
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