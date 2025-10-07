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
  const [eraseMode, setEraseMode] = useState("brush"); // 'brush' or 'color'
  const [brushSize, setBrushSize] = useState(20);
  const [colorTolerance, setColorTolerance] = useState(10);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isColorPicking, setIsColorPicking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, visible: false });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const originalFgBitmapRef = useRef(null);
  const eraseDataRef = useRef([]);
  const lastTouchRef = useRef(null);
  const foregroundCanvasRef = useRef(null);
  const backgroundBitmapRef = useRef(null);

  // Initialize foreground canvas and load background image
  useEffect(() => {
    if (fgBlob && canvasRef.current) {
      foregroundCanvasRef.current = document.createElement('canvas');
    }
  }, [fgBlob]);

  // Load background image when bgFile changes
  useEffect(() => {
    const loadBackgroundImage = async () => {
      if (bgFile && bgOption === "image") {
        backgroundBitmapRef.current = await createImageBitmap(bgFile);
      } else {
        backgroundBitmapRef.current = null;
      }
    };
    
    if (bgFile) {
      loadBackgroundImage();
    }
  }, [bgFile, bgOption]);

  // Live preview redraw
  useEffect(() => {
    const drawPreview = async () => {
      if (!fgBlob || !canvasRef.current || !foregroundCanvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const fgCanvas = foregroundCanvasRef.current;
      const fgCtx = fgCanvas.getContext("2d");

      // Store original bitmap if not already stored
      if (!originalFgBitmapRef.current) {
        originalFgBitmapRef.current = await createImageBitmap(fgBlob);
        canvas.width = originalFgBitmapRef.current.width;
        canvas.height = originalFgBitmapRef.current.height;
        fgCanvas.width = originalFgBitmapRef.current.width;
        fgCanvas.height = originalFgBitmapRef.current.height;
        
        // Initialize foreground canvas with the original image
        fgCtx.drawImage(originalFgBitmapRef.current, 0, 0);
      }

      // Clear main canvas only
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background on main canvas
      if (bgOption === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgOption === "image" && backgroundBitmapRef.current) {
        ctx.drawImage(backgroundBitmapRef.current, 0, 0, canvas.width, canvas.height);
      }
      // For transparent background, we don't draw anything

      // Draw the foreground canvas (with erasures) onto main canvas
      ctx.drawImage(fgCanvas, 0, 0);
    };

    drawPreview();
  }, [fgBlob, bgOption, bgColor, bgFile]);

  // Get pixel color from coordinates
  const getColorAtCoordinates = (x, y) => {
    if (!originalFgBitmapRef.current) return null;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = originalFgBitmapRef.current.width;
    tempCanvas.height = originalFgBitmapRef.current.height;
    
    // Draw the original image to get the color
    tempCtx.drawImage(originalFgBitmapRef.current, 0, 0);
    
    const imageData = tempCtx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    
    return {
      r, g, b,
      hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    };
  };

  // Color distance calculation (for tolerance)
  const colorDistance = (color1, color2) => {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
  };

  // Erase all pixels of the selected color
  const eraseColor = (targetColor, tolerance) => {
    if (!foregroundCanvasRef.current || !targetColor) return;

    const fgCanvas = foregroundCanvasRef.current;
    const fgCtx = fgCanvas.getContext("2d");
    
    // Get image data from foreground canvas
    const imageData = fgCtx.getImageData(0, 0, fgCanvas.width, fgCanvas.height);
    const data = imageData.data;
    
    // Iterate through all pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const currentColor = { r, g, b };
      const distance = colorDistance(currentColor, targetColor);
      
      // If color is within tolerance, set alpha to 0
      if (distance <= tolerance) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    // Put the modified image data back
    fgCtx.putImageData(imageData, 0, 0);
    
    // Redraw main canvas
    redrawMainCanvas();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setFgBlob(null);
      setBgFile(null);
      setBgOption("transparent");
      originalFgBitmapRef.current = null;
      backgroundBitmapRef.current = null;
      eraseDataRef.current = [];
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setSelectedColor(null);
      setIsColorPicking(false);
    }
  };

  const processImage = async () => {
    if (!inputImage) return alert("Please upload an image");

    setLoading(true);
    try {
      const blob = await removeBackground(inputImage);
      setFgBlob(blob);
      eraseDataRef.current = [];
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setSelectedColor(null);
      setIsColorPicking(false);
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
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Update cursor position for brush preview
    setCursorPosition({
      x: clientX - rect.left,
      y: clientY - rect.top,
      visible: true
    });

    // Adjust for zoom and position to get actual image coordinates
    const x = ((clientX - rect.left) / zoom) - (position.x / zoom);
    const y = ((clientY - rect.top) / zoom) - (position.y / zoom);

    return { x: Math.round(x), y: Math.round(y) };
  };

  // Handle cursor movement for brush preview
  const handleCursorMove = (e) => {
    if (!isErasing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX, clientY;
    
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    setCursorPosition({
      x: clientX - rect.left,
      y: clientY - rect.top,
      visible: true
    });
  };

  const handleCursorLeave = () => {
    setCursorPosition(prev => ({ ...prev, visible: false }));
  };

  // Handle color picker click
  const handleColorPick = (e) => {
    if (!isColorPicking || !originalFgBitmapRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const color = getColorAtCoordinates(coords.x, coords.y);
    if (color) {
      setSelectedColor(color);
      setIsColorPicking(false);
      
      // Automatically erase the selected color
      eraseColor(color, colorTolerance);
    }
  };

  // Handle brush erase start
  const handleBrushEraseStart = (e) => {
    if (!isErasing || eraseMode !== "brush" || !canvasRef.current || !fgBlob || !foregroundCanvasRef.current) return;
    
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

    // Apply erase to foreground canvas only
    const fgCanvas = foregroundCanvasRef.current;
    const fgCtx = fgCanvas.getContext("2d");
    fgCtx.globalCompositeOperation = "destination-out";
    fgCtx.beginPath();
    fgCtx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
    fgCtx.fill();
    fgCtx.globalCompositeOperation = "source-over";

    // Redraw the main canvas with updated foreground
    redrawMainCanvas();

    // Store last touch for continuous erasing
    if (e.touches) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Handle continuous brush erasing
  const handleBrushEraseMove = (e) => {
    if (!isErasing || eraseMode !== "brush" || !canvasRef.current || !fgBlob || !foregroundCanvasRef.current) return;
    
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

    // Apply erase to foreground canvas only
    const fgCanvas = foregroundCanvasRef.current;
    const fgCtx = fgCanvas.getContext("2d");
    fgCtx.globalCompositeOperation = "destination-out";
    fgCtx.beginPath();
    fgCtx.arc(coords.x, coords.y, brushSize, 0, Math.PI * 2);
    fgCtx.fill();
    fgCtx.globalCompositeOperation = "source-over";

    // Redraw the main canvas with updated foreground
    redrawMainCanvas();

    // Update last touch
    if (e.touches) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Redraw main canvas with background and foreground
  const redrawMainCanvas = async () => {
    if (!canvasRef.current || !foregroundCanvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const fgCanvas = foregroundCanvasRef.current;

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (bgOption === "color") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgOption === "image" && backgroundBitmapRef.current) {
      ctx.drawImage(backgroundBitmapRef.current, 0, 0, canvas.width, canvas.height);
    }
    // For transparent background, we don't draw anything

    // Draw foreground canvas (with erasures) onto main canvas
    ctx.drawImage(fgCanvas, 0, 0);
  };

  // Handle panning (image movement)
  const handlePanStart = (e) => {
    if (isErasing && (eraseMode === "brush" || isColorPicking)) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    if (e.touches) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      lastTouchRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanMove = (e) => {
    if (!isDragging || (isErasing && (eraseMode === "brush" || isColorPicking))) return;
    
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

  const downloadImage = async () => {
    if (!canvasRef.current || !originalFgBitmapRef.current || !foregroundCanvasRef.current) return;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = originalFgBitmapRef.current.width;
    tempCanvas.height = originalFgBitmapRef.current.height;

    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    if (bgOption === "color") {
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    } else if (bgOption === "image" && backgroundBitmapRef.current) {
      tempCtx.drawImage(backgroundBitmapRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
    }

    tempCtx.drawImage(foregroundCanvasRef.current, 0, 0);

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
    if (canvasRef.current && originalFgBitmapRef.current && foregroundCanvasRef.current) {
      const fgCanvas = foregroundCanvasRef.current;
      const fgCtx = fgCanvas.getContext("2d");
      
      fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
      fgCtx.drawImage(originalFgBitmapRef.current, 0, 0);
      
      redrawMainCanvas();
    }
    setSelectedColor(null);
  };

  // Handle click based on current mode
  const handleCanvasClick = (e) => {
    if (isColorPicking) {
      handleColorPick(e);
    } else if (isErasing && eraseMode === "brush") {
      handleBrushEraseStart(e);
    } else {
      handlePanStart(e);
    }
  };

  // Handle move based on current mode
  const handleCanvasMove = (e) => {
    handleCursorMove(e);
    
    if (isErasing && eraseMode === "brush") {
      handleBrushEraseMove(e);
    } else {
      handlePanMove(e);
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
                
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      setEraseMode("brush");
                      setIsErasing(true);
                      setIsColorPicking(false);
                    }}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      eraseMode === "brush" && isErasing
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Brush Erase
                  </button>
                  <button
                    onClick={() => {
                      setEraseMode("color");
                      setIsErasing(true);
                      setIsColorPicking(true);
                    }}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      eraseMode === "color" && isErasing
                        ? 'bg-green-600 text-white' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    Color Erase
                  </button>
                </div>

                <div className="flex gap-4 items-center flex-wrap">
                  <button
                    onClick={() => setIsErasing(!isErasing)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      isErasing 
                        ? eraseMode === "brush" ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {isErasing ? (eraseMode === "color" && isColorPicking ? 'Pick Color...' : 'Erasing...') : 'Enable Erase'}
                  </button>

                  <button
                    onClick={resetErase}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Reset Erase
                  </button>
                </div>

                {eraseMode === "brush" && (
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
                )}

                {eraseMode === "color" && selectedColor && (
                  <div className="flex items-center gap-4 p-3 bg-white/50 rounded-lg">
                    <div 
                      className="w-10 h-10 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Selected Color</span>
                      <span className="text-xs text-gray-600">{selectedColor.hex}</span>
                    </div>
                  </div>
                )}

                {eraseMode === "color" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-900">Color Tolerance: {colorTolerance}</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={colorTolerance}
                      onChange={(e) => setColorTolerance(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">
                      Lower = exact match, Higher = similar colors
                    </p>
                  </div>
                )}

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

                {isErasing && eraseMode === "brush" && (
                  <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded-lg">
                    {window.innerWidth < 768 
                      ? "Touch and drag on the image to erase areas" 
                      : "Click and drag on the image to erase areas"}
                  </p>
                )}

                {isErasing && eraseMode === "color" && isColorPicking && (
                  <p className="text-sm text-green-700 bg-green-100 p-2 rounded-lg">
                    Click on any color in the image to erase all similar colors
                  </p>
                )}

                {isErasing && eraseMode === "color" && !isColorPicking && selectedColor && (
                  <p className="text-sm text-green-700 bg-green-100 p-2 rounded-lg">
                    Color {selectedColor.hex} erased! Click "Color Erase" again to select another color.
                  </p>
                )}

                {!isErasing && (
                  <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded-lg">
                    {window.innerWidth < 768 
                      ? "Touch and drag to pan the image" 
                      : "Click and drag to pan the image"}
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
                cursor: isColorPicking ? 'crosshair' : 
                        isErasing && eraseMode === "brush" ? 'crosshair' : 
                        isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
              onMouseMove={handleCursorMove}
              onMouseLeave={handleCursorLeave}
              onTouchMove={handleCursorMove}
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
                  className={`block ${
                    isColorPicking ? 'border-green-400' : 
                    isErasing && eraseMode === "brush" ? 'border-red-400' : 
                    'border-blue-300'
                  }`}
                  onMouseDown={handleCanvasClick}
                  onMouseMove={handleCanvasMove}
                  onMouseUp={handlePanEnd}
                  onMouseLeave={() => {
                    handlePanEnd();
                    handleCursorLeave();
                  }}
                  onTouchStart={handleCanvasClick}
                  onTouchMove={handleCanvasMove}
                  onTouchEnd={handlePanEnd}
                  onTouchCancel={handlePanEnd}
                />
              </div>

              {/* Brush Preview */}
              {isErasing && eraseMode === "brush" && cursorPosition.visible && (
                <div 
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: cursorPosition.x - brushSize * zoom / 2,
                    top: cursorPosition.y - brushSize * zoom / 2,
                    width: `${brushSize * zoom}px`,
                    height: `${brushSize * zoom}px`,
                    border: '2px solid red',
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    boxShadow: '0 0 0 1px white'
                  }}
                />
              )}

              {/* Color Picker Preview */}
              {isColorPicking && cursorPosition.visible && (
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    left: cursorPosition.x - 10,
                    top: cursorPosition.y - 10,
                    width: '20px',
                    height: '20px',
                    border: '2px solid green',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 255, 0, 0.3)',
                    boxShadow: '0 0 0 1px white'
                  }}
                />
              )}

              {isErasing && eraseMode === "brush" && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  Brush Erase Active
                </div>
              )}

              {isColorPicking && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                  Color Picker Active
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