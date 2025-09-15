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

  const canvasRef = document.createElement("canvas"); // hidden canvas

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

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Convert hex string back to blob
      const frontBlob = new Blob([new Uint8Array(Buffer.from(data.front, "hex"))], { type: "image/jpeg" });
      const backBlob = new Blob([new Uint8Array(Buffer.from(data.back, "hex"))], { type: "image/jpeg" });

      setFrontPreview(URL.createObjectURL(frontBlob));
      setBackPreview(URL.createObjectURL(backBlob));
    } catch (e) {
      setError("Failed to process Civil ID. Try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const downloadPDF = () => {
    const pdf = new jsPDF("p", "pt", "a4");
    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    const a4Width = 2480;
    const a4Height = 3508;
    canvas.width = a4Width;
    canvas.height = a4Height;

    // White background
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, a4Width, a4Height);

    const drawImageOnCanvas = (img, yOffset) => {
      const temp = document.createElement("canvas");
      const tctx = temp.getContext("2d");
      temp.width = img.width;
      temp.height = img.height;
      tctx.drawImage(img, 0, 0);
      const targetWidth = 2000;
      const targetHeight = 1200;
      ctx.drawImage(temp, (a4Width - targetWidth)/2, yOffset, targetWidth, targetHeight);
    };

    const frontImg = new Image();
    const backImg = new Image();
    frontImg.src = frontPreview;
    backImg.src = backPreview;

    frontImg.onload = () => {
      drawImageOnCanvas(frontImg, 200);
      backImg.onload = () => {
        drawImageOnCanvas(backImg, 200 + 1200 + 200);

        // Add watermark if any
        if (watermark) {
          ctx.save();
          ctx.font = "80px Arial";
          ctx.fillStyle = "rgba(150,150,150,0.15)";
          ctx.textAlign = "center";
          ctx.translate(a4Width / 2, a4Height / 2);
          ctx.rotate(-Math.PI / 6);
          for (let y = -2000; y < 2000; y += 400) {
            for (let x = -2000; x < 2000; x += 800) {
              ctx.fillText(watermark, x, y);
            }
          }
          ctx.restore();
        }

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        pdf.addImage(imgData, "JPEG", 0, 0, 595, 842);
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
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "front")} className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70" />
        </div>
        <div>
          <label className="font-semibold text-blue-900">Upload Back Side:</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "back")} className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70" />
        </div>
        <div>
          <label className="font-semibold text-blue-900">Optional Watermark:</label>
          <input type="text" placeholder="Enter watermark text" value={watermark} onChange={(e) => setWatermark(e.target.value)} className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full" />
        </div>
        <button onClick={processCivilID} disabled={loading} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300">
          {loading ? "Processing Civil ID..." : "Process Civil ID"}
        </button>
        {error && <p className="text-red-600 font-semibold">{error}</p>}
      </div>

      {(frontPreview || backPreview) && (
        <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-xl">
          <h2 className="text-2xl font-semibold text-blue-900">Preview:</h2>
          {frontPreview && <img src={frontPreview} alt="Front" className="border border-blue-300 shadow-md rounded-xl" />}
          {backPreview && <img src={backPreview} alt="Back" className="border border-blue-300 shadow-md rounded-xl" />}
          <button onClick={downloadPDF} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300">
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}