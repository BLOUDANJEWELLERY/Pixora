"use client";
import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import getPerspectiveCroppedImg from "../components/getPerspectiveCroppedImg.js"; // helper

export default function CivilIdPage() {
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watermark, setWatermark] = useState("");
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editImage, setEditImage] = useState(null);
  const [editPoints, setEditPoints] = useState([]); // [{x,y}, ...]

  const canvasRef = useRef(null);
  const draggingPointIndex = useRef(null);

  const handleEdit = (image) => {
    setEditImage(image);
    // Default rectangle points with some margin
    setEditPoints([
      { x: 50, y: 50 },
      { x: 350, y: 50 },
      { x: 350, y: 200 },
      { x: 50, y: 200 },
    ]);
    setEditing(true);
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    editPoints.forEach((pt, idx) => {
      if (Math.hypot(pt.x - x, pt.y - y) < 10) {
        draggingPointIndex.current = idx;
      }
    });
  };

  const handleMouseMove = (e) => {
    if (draggingPointIndex.current === null) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoints = [...editPoints];
    newPoints[draggingPointIndex.current] = { x, y };
    setEditPoints(newPoints);
  };

  const handleMouseUp = () => {
    draggingPointIndex.current = null;
  };

  // Draw image + points
  useEffect(() => {
    if (!canvasRef.current || !editImage) return;
    const ctx = canvasRef.current.getContext("2d");
    const img = new Image();
    img.src = editImage;
    img.onload = () => {
      canvasRef.current.width = img.width;
      canvasRef.current.height = img.height;
      ctx.clearRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      // draw polygon
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      editPoints.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.stroke();
      // draw points
      editPoints.forEach((pt) => {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    };
  }, [editPoints, editImage]);

  const handleDoneEditing = async () => {
    const cropped = await getPerspectiveCroppedImg(editImage, editPoints);
    // Replace original image
    if (editImage === frontPreview) setFrontPreview(cropped);
    else if (editImage === backPreview) setBackPreview(cropped);
    setEditing(false);
  };

  const downloadPDF = () => {
    if (!frontPreview || !backPreview) return;

    const pdf = new jsPDF("p", "pt", "a4");
    const a4Width = 595;
    const a4Height = 842;
    const margin = 20;

    const frontImg = new Image();
    const backImg = new Image();
    frontImg.src = frontPreview;
    backImg.src = backPreview;

    frontImg.onload = () => {
      backImg.onload = () => {
        const availableHeight = a4Height - margin * 2;
        const spacing = availableHeight * 0.1;
        const maxImgHeight = (availableHeight - spacing) / 2 * 0.7;

        // Front image size
        let frontRatio = frontImg.width / frontImg.height;
        let frontHeight = maxImgHeight;
        let frontWidth = frontHeight * frontRatio;
        if (frontWidth > a4Width - margin * 2) {
          frontWidth = a4Width - margin * 2;
          frontHeight = frontWidth / frontRatio;
        }
        const frontX = (a4Width - frontWidth) / 2;
        const frontY = margin + (availableHeight / 2 - frontHeight - spacing / 2) / 2;

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

        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, a4Width, a4Height, "F");

        pdf.addImage(frontImg, "JPEG", frontX, frontY, frontWidth, frontHeight);
        pdf.addImage(backImg, "JPEG", backX, backY, backWidth, backHeight);

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
    <div className="min-h-screen bg-blue-50 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Civil ID Processor</h1>

      {frontPreview && (
        <div className="flex flex-col gap-4 w-full max-w-xl">
          <img src={frontPreview} alt="Front" className="border shadow rounded" />
          <button onClick={() => handleEdit(frontPreview)} className="bg-blue-600 text-white py-2 px-4 rounded">
            Edit Front
          </button>
        </div>
      )}
      {backPreview && (
        <div className="flex flex-col gap-4 w-full max-w-xl mt-4">
          <img src={backPreview} alt="Back" className="border shadow rounded" />
          <button onClick={() => handleEdit(backPreview)} className="bg-blue-600 text-white py-2 px-4 rounded">
            Edit Back
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 p-4">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="border bg-white"
          />
          <div className="mt-4 flex gap-4">
            <button onClick={handleDoneEditing} className="bg-green-600 text-white px-4 py-2 rounded">
              Done
            </button>
            <button onClick={() => setEditing(false)} className="bg-red-600 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {(frontPreview || backPreview) && (
        <button onClick={downloadPDF} className="mt-6 bg-blue-700 text-white px-6 py-3 rounded shadow">
          Download PDF
        </button>
      )}
    </div>
  );
}