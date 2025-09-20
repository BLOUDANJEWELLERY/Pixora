// pages/civil-id.js:
"use client";
import jsPDF from "jspdf";
import React, { useState, useRef, useEffect } from "react";

// Point type
interface Point {
  x: number;
  y: number;
}

interface CropperProps {
  src: string;
  onCropChange: (croppedDataUrl: string) => void;
}

export default function FreeformCropper({ src, onCropChange }: CropperProps) {
  // Initial corner points
  const [corners, setCorners] = useState<Point[]>([]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start dragging a corner
  const startDrag = (index: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
  };

  // Stop dragging
  const stopDrag = () => setDraggingIndex(null);

  // Dragging logic
  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (draggingIndex === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : e.touches[0].clientX;
    const clientY = "clientY" in e ? e.clientY : e.touches[0].clientY;

    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);

    setCorners((prev) =>
      prev.map((c, i) => (i === draggingIndex ? { x, y } : c))
    );
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onDrag);
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onDrag);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [draggingIndex]);

  // Crop image based on corners
  const handleCrop = () => {
    if (!imgRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imgRef.current, minX, minY, width, height, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/png");
    onCropChange(dataUrl);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <img
        src={src}
        ref={imgRef}
        className="block w-full rounded-xl border border-blue-300"
        alt="To crop"
      />
      {/* Polygon overlay */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <polygon
          points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="rgba(59,130,246,0.2)"
          stroke="rgba(59,130,246,0.8)"
          strokeWidth={2}
        />
      </svg>
      {/* Draggable corners */}
      {corners.map((corner, idx) => (
        <div
          key={idx}
          onMouseDown={startDrag(idx)}
          onTouchStart={startDrag(idx)}
          className="absolute w-4 h-4 bg-blue-600 rounded-full cursor-grab"
          style={{ left: corner.x - 8, top: corner.y - 8 }}
        />
      ))}
      <button
        onClick={handleCrop}
        className="mt-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-2 px-4 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
      >
        Crop
      </button>
    </div>
  );
}

export default function CivilIdPage() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [watermark, setWatermark] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "front") {
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
    } else {
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const processCivilID = async () => {
    if (!frontFile || !backFile) {
      setError("Please upload both front and back images.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("front", frontFile);
      formData.append("back", backFile);

      const res = await fetch("https://civil-id-server.onrender.com/process-civil-id", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      // Decode base64 directly into image URLs
      setFrontPreview(`data:image/jpeg;base64,${data.front}`);
      setBackPreview(`data:image/jpeg;base64,${data.back}`);
    } catch (e) {
      setError("Failed to process Civil ID. Try again.");
      console.error(e);
    }
    setLoading(false);
  };

const downloadPDF = () => {
  if (!frontPreview || !backPreview) return;

  const pdf = new jsPDF("p", "pt", "a4");
  const a4Width = 595;   // pt
  const a4Height = 842;  // pt
  const margin = 20;

  const frontImg = new Image();
  const backImg = new Image();
  frontImg.src = frontPreview;
  backImg.src = backPreview;

  frontImg.onload = () => {
    backImg.onload = () => {
      // Calculate available height for both images with spacing
      const availableHeight = a4Height - margin * 2;
      const spacing = availableHeight * 0.1; // space between front and back
      const maxImgHeight = (availableHeight - spacing) / 2 * 0.7; // reduce by 30%
      
      // Front image size
      let frontRatio = frontImg.width / frontImg.height;
      let frontHeight = maxImgHeight;
      let frontWidth = frontHeight * frontRatio;
      if (frontWidth > a4Width - margin * 2) {
        frontWidth = a4Width - margin * 2;
        frontHeight = frontWidth / frontRatio;
      }
      const frontX = (a4Width - frontWidth) / 2;
      const frontY = margin + (availableHeight / 2 - frontHeight - spacing/2) / 2;

      // Back image size
      let backRatio = backImg.width / backImg.height;
      let backHeight = maxImgHeight;
      let backWidth = backHeight * backRatio;
      if (backWidth > a4Width - margin * 2) {
        backWidth = a4Width - margin * 2;
        backHeight = backWidth / backRatio;
      }
      const backX = (a4Width - backWidth) / 2;
      const backY = frontY + frontHeight + spacing;

      // White background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, a4Width, a4Height, "F");

      // Add images
      pdf.addImage(frontImg, "JPEG", frontX, frontY, frontWidth, frontHeight);
      pdf.addImage(backImg, "JPEG", backX, backY, backWidth, backHeight);

      // Watermark if any
      if (watermark) {
        pdf.setTextColor(180, 180, 180);
        pdf.setFontSize(50);
        pdf.text(watermark, a4Width / 2, a4Height / 2, { align: "center", angle: -45 });
      }

      pdf.save("civil-id.pdf");
    };
  };
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Civil ID Processor</h1>

    <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30">
  <div>
    <label className="font-semibold text-blue-900">Upload Front Side:</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleFileChange(e, "front")}
      className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full"
    />
  </div>

  <div>
    <label className="font-semibold text-blue-900">Upload Back Side:</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => handleFileChange(e, "back")}
      className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full"
    />
  </div>

  <div>
    <label className="font-semibold text-blue-900">Optional Watermark:</label>
    <input
      type="text"
      placeholder="Enter watermark text"
      value={watermark}
      onChange={(e) => setWatermark(e.target.value)}
      className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full"
    />
  </div>

  <button
    onClick={processCivilID}
    disabled={loading}
    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 w-full"
  >
    {loading ? "Processing Civil ID..." : "Process Civil ID"}
  </button>

  {error && <p className="text-red-600 font-semibold">{error}</p>}
</div>

  {(frontPreview || backPreview) && (
        <div className="mt-8 flex flex-col items-center gap-6 w-full max-w-xl">
          {frontPreview && (
            <div>
              <h2 className="text-2xl font-semibold text-blue-900 mb-2">Front Side:</h2>
              <FreeformCropper src={frontPreview} onCropChange={setFrontPreview} />
            </div>
          )}
          {backPreview && (
            <div>
              <h2 className="text-2xl font-semibold text-blue-900 mb-2">Back Side:</h2>
              <FreeformCropper src={backPreview} onCropChange={setBackPreview} />
            </div>
          )}
          <button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
          >
            Download PDF
          </button>
        </div>
      )}