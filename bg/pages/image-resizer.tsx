"use client";
import { useState } from "react";
import Header from "../components/Header";

export default function ImageResizer() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [resized, setResized] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const url = URL.createObjectURL(file);
    setPreview(url);

    const img = new Image();
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = url;
  };

  const handleResize = () => {
    if (!image || !width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, width, height);
      const resizedUrl = canvas.toDataURL("image/png");
      setResized(resizedUrl);
    };
    img.src = URL.createObjectURL(image);
  };

  const handleDownload = () => {
    if (!resized) return;
    const a = document.createElement("a");
    a.href = resized;
    a.download = "resized-image.png";
    a.click();
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-lg">
          Image Resizer
        </h1>

        <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-blue-200 border-opacity-30 flex flex-col items-center w-full max-w-md gap-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-blue-900 cursor-pointer"
          />

          {preview && (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />

              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-blue-900">Width</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>

                <div>
                  <label className="text-sm text-blue-900">Height</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>
              </div>

              <button
                onClick={handleResize}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all"
              >
                Resize Image
              </button>
            </>
          )}

          {resized && (
            <div className="flex flex-col items-center gap-4 mt-6">
              <img
                src={resized}
                alt="Resized"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all"
              >
                Download Resized Image
              </button>
            </div>
          )}
        </div>

        <p className="text-blue-900 text-sm mt-12">
          Resize images instantly — no quality loss, no waiting.
        </p>
      </div>
    </>
  );
}