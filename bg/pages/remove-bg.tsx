"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createBackgroundRemoval } from "@imgly/background-removal";
import Header from "../components/Header";

// 🧩 Define proper type for the background removal function
type BackgroundRemover = (options: { image: File | Blob | string }) => Promise<Blob>;

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [fgBlob, setFgBlob] = useState<Blob | null>(null);
  const [bgOption, setBgOption] = useState<"transparent" | "color" | "image">("transparent");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🧠 Preload and cache background removal model once
  const backgroundRemover = useMemo<BackgroundRemover | null>(() => {
    if (typeof window === "undefined") return null;
    return createBackgroundRemoval();
  }, []);

  // 🖼️ Redraw preview whenever fg/bg changes
  useEffect(() => {
    const drawPreview = async (): Promise<void> => {
      if (!fgBlob || !canvasRef.current) return;

      const fgBitmap = await createImageBitmap(fgBlob);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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

      // Draw foreground
      ctx.drawImage(fgBitmap, 0, 0);
    };

    drawPreview();
  }, [fgBlob, bgOption, bgColor, bgFile, canvasRef]);

  // 🧾 File input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    setInputImage(file);
    setFgBlob(null);
    setBgFile(null);
    setBgOption("transparent");
    setError(null);
  };

  // ⚙️ Process image with cached model
  const processImage = async (): Promise<void> => {
    if (!inputImage) {
      alert("Please upload an image first.");
      return;
    }

    if (!backgroundRemover) {
      alert("Background remover not ready yet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const blob = await backgroundRemover({ image: inputImage });
      setFgBlob(blob);
    } catch (err) {
      console.error("❌ Background removal failed:", err);
      setError("Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🌆 Background file handler
  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    setBgFile(file);
  };

  // 💾 Download final composite
  const downloadImage = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center drop-shadow-lg tracking-wide animate-fadeIn">
          Background Remover & Replacer
        </h1>

        {/* Upload Card */}
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

          {error && (
            <p className="text-red-600 font-medium text-center">{error}</p>
          )}

          {/* Background options after processing */}
          {fgBlob && (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-blue-900">Background Option:</label>
                <select
                  value={bgOption}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBgOption(e.target.value as "transparent" | "color" | "image")}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBgColor(e.target.value)}
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

        {/* Live Preview */}
        {fgBlob && (
          <div className="mt-10 bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-6 w-full max-w-xl flex flex-col items-center gap-4 border border-blue-200 border-opacity-30 animate-fadeIn">
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-900 drop-shadow-sm">Live Preview:</h2>
            <canvas ref={canvasRef} className="rounded-2xl border border-blue-300 max-w-full shadow-md" />
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
