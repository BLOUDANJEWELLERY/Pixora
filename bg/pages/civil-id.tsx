Now i need to enhance this civil id pdf generator page firstly the image upload fields are going out of their container box towards fix them in and when creating pdf the civil id images should have a rounder borders so it feels more beautiful while keeping live preview and watermark and everything else intact:
// pages/civil-id.js:
"use client";
import { useState } from "react";
import jsPDF from "jspdf";

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
            className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70"
          />
        </div>
        <div>
          <label className="font-semibold text-blue-900">Upload Back Side:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "back")}
            className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70"
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
          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
        >
          {loading ? "Processing Civil ID..." : "Process Civil ID"}
        </button>
        {error && <p className="text-red-600 font-semibold">{error}</p>}
      </div>

      {(frontPreview || backPreview) && (
        <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-xl">
          <h2 className="text-2xl font-semibold text-blue-900">Preview:</h2>
          {frontPreview && <img src={frontPreview} alt="Front" className="border border-blue-300 shadow-md rounded-xl" />}
          {backPreview && <img src={backPreview} alt="Back" className="border border-blue-300 shadow-md rounded-xl" />}
          <button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}