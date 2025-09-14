import { useState } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState(null);
  const [bgOption, setBgOption] = useState("transparent"); // "transparent", "color", "image"
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setProcessedUrl(null);
    }
  };

  const handleBgFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setBgFile(file);
  };

  const processImage = async () => {
    if (!inputImage) return alert("Please upload an image");

    setLoading(true);

    try {
      const fgBlob = await removeBackground(inputImage);
      const fgBitmap = await createImageBitmap(fgBlob);

      const canvas = document.createElement("canvas");
      canvas.width = fgBitmap.width;
      canvas.height = fgBitmap.height;
      const ctx = canvas.getContext("2d");

      if (bgOption === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgOption === "image" && bgFile) {
        const bgBitmap = await createImageBitmap(bgFile);
        ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(fgBitmap, 0, 0);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setProcessedUrl(url);
        setLoading(false);
      }, "image/png");
    } catch (err) {
      console.error(err);
      alert("Failed: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        Background Remover & Replacer
      </h1>

      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-xl flex flex-col gap-6">
        {/* Upload Image */}
        <div className="flex flex-col">
          <label className="mb-2 font-semibold text-gray-700">Upload Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="p-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Background Option */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">Background Option:</label>
          <select
            value={bgOption}
            onChange={(e) => setBgOption(e.target.value)}
            className="p-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="transparent">Transparent</option>
            <option value="color">Solid Color</option>
            <option value="image">Image</option>
          </select>
        </div>

        {bgOption === "color" && (
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Pick Background Color:</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-20 h-10 border rounded-lg cursor-pointer"
            />
          </div>
        )}

        {bgOption === "image" && (
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">Upload Background Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBgFileChange}
              className="p-2 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        )}

        <button
          onClick={processImage}
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Process Image"}
        </button>
      </div>

      {/* Result */}
      {processedUrl && (
        <div className="mt-8 bg-white shadow-lg rounded-xl p-6 w-full max-w-xl flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-800">Result:</h2>
          <img src={processedUrl} alt="Processed" className="rounded-lg border border-gray-200 max-w-full" />
          <a
            href={processedUrl}
            download="output.png"
            className="mt-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold rounded-lg shadow transition"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}