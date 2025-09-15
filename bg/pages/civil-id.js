"use client";
import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

export default function CivilIdPage() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [watermark, setWatermark] = useState("");
  const [processed, setProcessed] = useState(false);
  const canvasRef = useRef(null);
  const [cvReady, setCvReady] = useState(false);

  // Load OpenCV.js
  useEffect(() => {
    if (typeof window !== "undefined") {
      const check = setInterval(() => {
        if (window.cv && window.cv.imread) {
          setCvReady(true);
          clearInterval(check);
        }
      }, 500);
    }
  }, []);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "front") setFrontFile(file);
    if (type === "back") setBackFile(file);
  };

  const autoCropAndDeskew = async (file) => {
    const img = await createImageBitmap(file);

    // Draw on hidden canvas for OpenCV
    const hidden = document.createElement("canvas");
    hidden.width = img.width;
    hidden.height = img.height;
    const hctx = hidden.getContext("2d");
    hctx.drawImage(img, 0, 0);

    let src = cv.imread(hidden);
    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let edges = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
    cv.Canny(blur, edges, 75, 200);

    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let approxCurve = null;

    for (let i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let peri = cv.arcLength(cnt, true);
      let approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

      if (approx.rows === 4) {
        let area = cv.contourArea(cnt);
        if (area > maxArea) {
          maxArea = area;
          approxCurve = approx;
        }
      }
    }

    let dst = new cv.Mat();
    if (approxCurve) {
      let pts = [];
      for (let i = 0; i < 4; i++) {
        pts.push({
          x: approxCurve.intAt(i, 0),
          y: approxCurve.intAt(i, 1),
        });
      }

      // Sort points [top-left, top-right, bottom-right, bottom-left]
      pts = pts.sort((a, b) => a.y - b.y);
      let top = pts.slice(0, 2).sort((a, b) => a.x - b.x);
      let bottom = pts.slice(2, 4).sort((a, b) => a.x - b.x);
      let ordered = [top[0], top[1], bottom[1], bottom[0]];

      let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        ordered[0].x, ordered[0].y,
        ordered[1].x, ordered[1].y,
        ordered[2].x, ordered[2].y,
        ordered[3].x, ordered[3].y
      ]);

      let w = 1000, h = 600; // standard ID size
      let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        w, 0,
        w, h,
        0, h
      ]);

      let M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(src, dst, M, new cv.Size(w, h));
    } else {
      dst = src.clone(); // fallback
    }

    return dst;
  };

  const processImages = async () => {
    if (!frontFile || !backFile) {
      alert("Upload both front and back images first");
      return;
    }
    if (!cvReady) {
      alert("OpenCV is not ready yet. Please wait a moment.");
      return;
    }

    const frontMat = await autoCropAndDeskew(frontFile);
    const backMat = await autoCropAndDeskew(backFile);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // A4 size at 300dpi
    canvas.width = 2480;
    canvas.height = 3508;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw front top
    let frontCanvas = document.createElement("canvas");
    cv.imshow(frontCanvas, frontMat);
    ctx.drawImage(frontCanvas, 240, 200, 2000, 1200);

    // Draw back bottom
    let backCanvas = document.createElement("canvas");
    cv.imshow(backCanvas, backMat);
    ctx.drawImage(backCanvas, 240, 200 + 1200 + 200, 2000, 1200);

    // Watermark
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
        <button onClick={processImages} disabled={!cvReady} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300">
          {cvReady ? "Process Civil ID" : "Loading OpenCV..."}
        </button>
      </div>

      {processed && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold text-blue-900">Preview:</h2>
          <canvas ref={canvasRef} className="border border-blue-300 shadow-md rounded-xl" />
          <button onClick={downloadPDF} className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300">
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}