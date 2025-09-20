"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";

export default function CivilIdPDF() {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (type === "front") {
          setFrontFile(file);
          setFrontPreview(reader.result as string);
        } else {
          setBackFile(file);
          setBackPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    if (!frontPreview) return;
    setLoading(true);

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = imgWidth * 0.6; // approximate ID ratio

    const drawImageRounded = (imgSrc: string, x: number, y: number, w: number, h: number, radius: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        // Rounded rectangle clip
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(w - radius, 0);
        ctx.quadraticCurveTo(w, 0, w, radius);
        ctx.lineTo(w, h - radius);
        ctx.quadraticCurveTo(w, h, w - radius, h);
        ctx.lineTo(radius, h);
        ctx.quadraticCurveTo(0, h, 0, h - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, 0, 0, w, h);

        // Draw watermark
        ctx.font = "20px Arial";
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.textAlign = "right";
        ctx.fillText("Pixora", w - 10, h - 10);

        const imgData = canvas.toDataURL("image/png");
        doc.addImage(imgData, "PNG", x, y, w, h);

        if (type === "back" && backPreview) {
          doc.addPage();
          drawImageRounded(backPreview, margin, margin, imgWidth, imgHeight, 15);
        } else {
          doc.save("civil-id.pdf");
          setLoading(false);
        }
      };
    };

    drawImageRounded(frontPreview, margin, margin, imgWidth, imgHeight, 15);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-10 text-center drop-shadow-lg tracking-wide">
        Civil ID PDF Maker
      </h1>

      {/* Upload Card */}
      <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30">
        <div className="flex flex-col gap-4">
          <label className="font-semibold text-blue-900">Front Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "front")}
            className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60 w-full"
          />

          <label className="font-semibold text-blue-900">Back Image (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "back")}
            className="p-2 border rounded-lg border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60 w-full"
          />
        </div>

        {(frontPreview || backPreview) && (
          <button
            onClick={generatePDF}
            disabled={loading}
            className={`relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Downloading..." : "Generate PDF"}
          </button>
        )}
      </div>

      {/* Live Preview */}
      <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-xl">
        {frontPreview && (
          <div className="bg-white/40 p-6 rounded-3xl shadow-xl w-full flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Front Preview</h2>
            <img
              src={frontPreview}
              alt="Front Preview"
              className="rounded-2xl border border-blue-300 max-w-full"
            />
          </div>
        )}
        {backPreview && (
          <div className="bg-white/40 p-6 rounded-3xl shadow-xl w-full flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">Back Preview</h2>
            <img
              src={backPreview}
              alt="Back Preview"
              className="rounded-2xl border border-blue-300 max-w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}