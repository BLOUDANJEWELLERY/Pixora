import { useState, useRef, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";
import Header from "../components/Header";

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [fgBlob, setFgBlob] = useState<Blob | null>(null);
  const [bgOption, setBgOption] = useState("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live preview redraw
  useEffect(() => {
    const drawPreview = async () => {
      if (!fgBlob || !canvasRef.current) return;

      try {
        const fgBitmap = await createImageBitmap(fgBlob);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          setError("Failed to get canvas context");
          return;
        }

        // Set canvas dimensions
        canvas.width = fgBitmap.width;
        canvas.height = fgBitmap.height;

        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (bgOption === "color") {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (bgOption === "image" && bgFile) {
          const bgBitmap = await createImageBitmap(bgFile);
          // Scale background to fit canvas
          ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height);
        }
        // For transparent, we just clear the canvas (already done above)

        // Draw foreground image
        ctx.drawImage(fgBitmap, 0, 0);
      } catch (err) {
        console.error("Error drawing preview:", err);
        setError("Failed to draw preview: " + (err as Error).message);
      }
    };

    drawPreview();
  }, [fgBlob, bgOption, bgColor, bgFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError("Image size should be less than 10MB");
        return;
      }
      
      setInputImage(file);
      setFgBlob(null);
      setBgFile(null);
      setBgOption("transparent");
      setError(null);
    }
  };

  const processImage = async () => {
    if (!inputImage) {
      alert("Please upload an image");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting background removal...");
      
      // Try different publicPath configurations
      const config = {
        publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.2.2/dist/", // Use specific version
        modelPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.2.2/dist/models/", // Explicit model path
        debug: true,
        progress: (key: string, current: number, total: number) => {
          console.log(`Downloading ${key}: ${current} of ${total}`);
        },
        // Alternative: use proxy to avoid CORS issues
        proxyToWorker: true,
        // Use simpler model if available
        model: "isnet" as const,
      };

      // Alternative: try without publicPath first
      let blob;
      try {
        blob = await removeBackground(inputImage, config);
      } catch (firstError) {
        console.warn("First attempt failed, trying alternative configuration:", firstError);
        
        // Try alternative CDN
        const altConfig = {
          publicPath: "https://unpkg.com/@imgly/background-removal@1.2.2/dist/",
          debug: true,
          proxyToWorker: true,
        };
        
        blob = await removeBackground(inputImage, altConfig);
      }
      
      console.log("Background removal successful, blob:", blob);
      
      setFgBlob(blob);
    } catch (err) {
      console.error("Background removal error:", err);
      const errorMessage = (err as Error).message || "Unknown error";
      setError("Failed to process image: " + errorMessage);
      
      // Provide more user-friendly error messages
      if (errorMessage.includes("models") || errorMessage.includes("model")) {
        alert("Failed to load AI models. This might be due to network issues. Please check your internet connection and try again.");
      } else if (errorMessage.includes("CORS")) {
        alert("Network error occurred. Please try refreshing the page or check your internet connection.");
      } else {
        alert("Failed to process image. Please try with a different image or check the console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file for background");
        return;
      }
      setBgFile(file);
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) {
          setError("Failed to create image blob");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "background-removed.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download image: " + (err as Error).message);
    }
  };

  // Reset everything
  const resetAll = () => {
    setInputImage(null);
    setFgBlob(null);
    setBgFile(null);
    setBgOption("transparent");
    setError(null);
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
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="absolute top-0 right-0 px-2 py-1 text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {!inputImage && !fgBlob && (
            <>
              <div className="flex flex-col">
                <label className="mb-2 font-semibold text-blue-900">Upload Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
                />
              </div>
              <div className="text-sm text-blue-600 text-center">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Max size: 10MB</p>
              </div>
            </>
          )}

          {inputImage && (
            <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
              Selected: <strong>{inputImage.name}</strong> ({(inputImage.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {!fgBlob && inputImage && (
            <div className="flex flex-col gap-4">
              <button
                onClick={processImage}
                disabled={loading}
                className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing... (This may take a moment)
                  </div>
                ) : (
                  "Remove Background"
                )}
              </button>
              
              <button
                onClick={resetAll}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Choose Different Image
              </button>
            </div>
          )}

          {/* Show background options only after processing */}
          {fgBlob && (
            <>
              <div className="border-t border-blue-200 pt-4">
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
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="font-semibold text-blue-900">Pick Background Color:</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-16 h-16 border rounded-lg cursor-pointer border-blue-300"
                      />
                      <span className="text-blue-700">{bgColor}</span>
                    </div>
                  </div>
                )}

                {bgOption === "image" && (
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="font-semibold text-blue-900">Upload Background Image:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgFileChange}
                      className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
                    />
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={downloadImage}
                    className="flex-1 relative overflow-hidden bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                  >
                    Download Image
                  </button>
                  
                  <button
                    onClick={resetAll}
                    className="flex-1 relative overflow-hidden bg-gradient-to-r from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Preview Card */}
        {fgBlob && (
          <div className="mt-10 bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-6 w-full max-w-xl flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 animate-fadeIn">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 drop-shadow-sm">Live Preview:</h2>
            <div className="bg-gray-100 p-4 rounded-2xl">
              <canvas 
                ref={canvasRef} 
                className="rounded-2xl border border-blue-300 max-w-full shadow-md" 
                style={{ maxHeight: '500px', maxWidth: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Loading indicator for model download */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Loading AI Models</h3>
              <p className="text-blue-700 text-sm">This may take a few moments on first use...</p>
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