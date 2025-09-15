"use client";

import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

export default function CivilIdPage() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [watermark, setWatermark] = useState("");
  const [cvReady, setCvReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processed, setProcessed] = useState(false);
  const canvasRef = useRef(null);

  // Load OpenCV.js dynamically from public folder
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/opencv.js"; // local file in public folder
    script.async = true;
    script.onload = () => {
      console.log("OpenCV.js loaded");
      window.cv['onRuntimeInitialized'] = () => {
        console.log("OpenCV WASM ready ✅");
        setCvReady(true);
      };
    };
    script.onerror = () => {
      setError("Failed to load OpenCV.js");
    };
    document.body.appendChild(script);

    const timeout = setTimeout(() => {
      if (!cvReady) setError("OpenCV loading timeout. Please refresh the page.");
    }, 20000); // 20s timeout

    return () => {
      document.body.removeChild(script);
      clearTimeout(timeout);
    };
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0] || null;
    if (type === "front") setFrontFile(file);
    if (type === "back") setBackFile(file);
  };

  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => resolve(img);
      img.onerror = () => reject("Failed to load image");
    });

  const autoCropAndDeskew = async (file) => {
    try {
      const img = await loadImage(file);

      const hidden = document.createElement("canvas");
      hidden.width = img.width;
      hidden.height = img.height;
      const ctx = hidden.getContext("2d");
      ctx.drawImage(img, 0, 0);
      document.body.appendChild(hidden); // needed for cv.imread
      let src = cv.imread(hidden);
      document.body.removeChild(hidden);

      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      let blur = new cv.Mat();
      cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
      let edges = new cv.Mat();
      cv.Canny(blur, edges, 75, 200);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let approxCurve = null;

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
          const area = cv.contourArea(cnt);
          if (area > maxArea) {
            maxArea = area;
            if (approxCurve) approxCurve.delete();
            approxCurve = approx;
          } else approx.delete();
        } else approx.delete();
      }

      let dst = new cv.Mat();
      if (approxCurve) {
        let pts = [];
        for (let i = 0; i < 4; i++)
          pts.push({ x: approxCurve.intAt(i, 0), y: approxCurve.intAt(i, 1) });

        pts.sort((a, b) => a.y - b.y);
        const top = pts.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = pts.slice(2, 4).sort((a, b) => a.x - b.x);
        const ordered = [top[0], top[1], bottom[1], bottom[0]];

        const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          ordered[0].x, ordered[0].y,
          ordered[1].x, ordered[1].y,
          ordered[2].x, ordered[2].y,
          ordered[3].x, ordered[3].y,
        ]);

        const w = 1000, h = 600;
        const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);
        const M = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(src, dst, M, new cv.Size(w, h));

        srcTri.delete(); dstTri.delete(); M.delete(); approxCurve.delete();
      } else {
        dst = new cv.Mat();
        const size = new cv.Size(1000, 600);
        cv.resize(src, dst, size);
      }

      src.delete(); gray.delete(); blur.delete(); edges.delete(); contours.delete(); hierarchy.delete();
      return dst;
    } catch (err) {
      console.error(err);
      throw new Error("Failed to process this image");
    }
  };

  const processImages = async () => {
    setError("");
    if (!frontFile || !backFile) {
      setError("Upload both front and back images first.");
      return;
    }
    if (!cvReady) {
      setError("OpenCV is still loading, please wait.");
      return;
    }

    setLoading(true);
    try {
      const frontMat = await autoCropAndDeskew(frontFile);
      const backMat = await autoCropAndDeskew(backFile);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = 2480;
      canvas.height = 3508;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let frontCanvas = document.createElement("canvas");
      cv.imshow(frontCanvas, frontMat);
      ctx.drawImage(frontCanvas, 240, 200, 2000, 1200);

      let backCanvas = document.createElement("canvas");
      cv.imshow(backCanvas, backMat);
      ctx.drawImage(backCanvas, 240, 200 + 1200 + 200, 2000, 1200);

      if (watermark) {
        ctx.save();
        ctx.font = "80px Arial";
        ctx.fillStyle = "rgba(150,150,150,0.15)";
        ctx.textAlign = "center";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        for (let y = -2000; y < 2000; y += 400) {
          for (let x = -2000; x < 2000; x += 800) {
            ctx.fillText(watermark, x, y);
          }
        }
        ctx.restore();
      }

      setProcessed(true);
    } catch (err) {
      setError(err.message || "Failed to process Civil ID.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const canvas = canvasRef.current;
    const pdf = new jsPDF("p", "pt", "a4");
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    pdf.addImage(imgData, "JPEG", 0, 0, 595, 842);
    pdf.save("civil-id.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Civil ID Processor</h1>

      <div className="bg-white/40 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30">
        <div>
          <label className="font-semibold text-blue-900">Upload Front Side:</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "front")} className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full" />
        </div>
        <div>
          <label className="font-semibold text-blue-900">Upload Back Side:</label>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "back")} className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full" />
        </div>
        <div>
          <label className="font-semibold text-blue-900">Optional Watermark:</label>
          <input type="text" placeholder="Enter watermark text" value={watermark} onChange={(e) => setWatermark(e.target.value)} className="block mt-2 p-2 border rounded-lg border-blue-300 bg-white/70 w-full" />
        </div>

        {error && <p className="text-red-600 font-medium">{error}</p>}

        <button
          onClick={processImages}
          disabled={!cvReady || loading}
          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          {loading ? "Processing Civil ID…" : cvReady ? "Process Civil ID" : "Loading OpenCV…"}
        </button>
      </div>

      {processed && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold text-blue-900">Preview:</h2>
          <canvas ref={canvasRef} className="border border-blue-300 shadow-md rounded-xl" />
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