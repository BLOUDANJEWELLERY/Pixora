import { useState, useRef, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";
import Header from "../components/Header";

export default function RemoveBgPage() {
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
      const imageURL = URL.createObjectURL(inputImage);
const blob = await removeBackground({ image: imageURL });
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