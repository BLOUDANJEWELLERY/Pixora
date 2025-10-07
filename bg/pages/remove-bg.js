// pages/remove-bg.js
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
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const canvasRef = useRef(null);

  // Preload the model when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const preloadModel = async () => {
      try {
        // Preload with a tiny dummy image to initialize the model
        const dummyImage = new Blob([
          new Uint8Array([
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
            0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x2c, 
            0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 
            0x02, 0x44, 0x01, 0x00, 0x3b
          ])
        ], { type: 'image/gif' });
        
        await removeBackground(dummyImage, {
          progress: (key, current, total) => {
            if (key === "compute:inference" && current === total && isMounted) {
              setIsModelLoaded(true);
              console.log("Background removal model loaded and ready!");
            }
          }
        });
      } catch (error) {
        console.warn("Model preloading failed, but will work normally:", error);
        if (isMounted) setIsModelLoaded(true); // Still mark as loaded to allow processing
      }
    };

    preloadModel();

    return () => {
      isMounted = false;
    };
  }, []);

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

        {/* Model Loading Indicator */}
        {!isModelLoaded && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-700">
            ⚡ Loading background removal engine... First processing might be faster!
          </div>
        )}

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
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Process Image"
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