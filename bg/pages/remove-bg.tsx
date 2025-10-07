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
      
      // Configure the background removal with proper options
      const config = {
        publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@latest/dist/",
        debug: true,
        progress: (key: string, current: number, total: number) => {
          console.log(`Downloading ${key}: ${current} of ${total}`);
        }
      };

      const blob = await removeBackground(inputImage, config);
      console.log("Background removal successful, blob:", blob);
      
      setFgBlob(blob);
    } catch (err) {
      console.error("Background removal error:", err);
      setError("Failed to process image: " + ((err as Error).message || "Unknown error"));
      alert("Failed to process image. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBgFile(file);
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
            </div>
          )}

          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-blue-900">Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
            />
          </div>

          {inputImage && (
            <div className="text-sm text-blue-700">
              Selected: {inputImage.name} ({(inputImage.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {!fgBlob && inputImage && (
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
                  Processing...
                </div>
              ) : (
                "Remove Background"
              )}
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
                className="relative overflow-hidden bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] mt-4"
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
            <canvas 
              ref={canvasRef} 
              className="rounded-2xl border border-blue-300 max-w-full shadow-md bg-gray-100" 
              style={{ maxHeight: '500px' }}
            />
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