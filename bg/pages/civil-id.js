"use client";
import { useState, useRef } from "react";
import Draggable from "react-draggable";
import jsPDF from "jspdf";

export default function CivilIdPage() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [watermark, setWatermark] = useState("");

  const [frontCorners, setFrontCorners] = useState([
    { x: 50, y: 50 }, // tl
    { x: 250, y: 50 }, // tr
    { x: 250, y: 150 }, // br
    { x: 50, y: 150 }, // bl
  ]);

  const [backCorners, setBackCorners] = useState([
    { x: 50, y: 50 },
    { x: 250, y: 50 },
    { x: 250, y: 150 },
    { x: 50, y: 150 },
  ]);

  const frontImgRef = useRef();
  const backImgRef = useRef();

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "front") {
      setFrontFile(file);
      setFrontPreview(url);
    } else {
      setBackFile(file);
      setBackPreview(url);
    }
  };

  const cropImage = (img, corners) => {
    const canvas = document.createElement("canvas");
    const width = Math.max(...corners.map(c => c.x)) - Math.min(...corners.map(c => c.x));
    const height = Math.max(...corners.map(c => c.y)) - Math.min(...corners.map(c => c.y));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const minX = Math.min(...corners.map(c => c.x));
    const minY = Math.min(...corners.map(c => c.y));

    ctx.drawImage(
      img,
      minX,
      minY,
      width,
      height,
      0,
      0,
      width,
      height
    );

    return canvas.toDataURL("image/jpeg");
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
        const croppedFront = cropImage(frontImg, frontCorners);
        const croppedBack = cropImage(backImg, backCorners);

        const frontPDFImg = new Image();
        const backPDFImg = new Image();
        frontPDFImg.src = croppedFront;
        backPDFImg.src = croppedBack;

        frontPDFImg.onload = () => {
          backPDFImg.onload = () => {
            const availableHeight = a4Height - margin * 2;
            const spacing = availableHeight * 0.1;
            const maxImgHeight = (availableHeight - spacing) / 2 * 0.7;

            let frontRatio = frontPDFImg.width / frontPDFImg.height;
            let frontHeight = maxImgHeight;
            let frontWidth = frontHeight * frontRatio;
            if (frontWidth > a4Width - margin * 2) {
              frontWidth = a4Width - margin * 2;
              frontHeight = frontWidth / frontRatio;
            }
            const frontX = (a4Width - frontWidth) / 2;
            const frontY = margin + (availableHeight / 2 - frontHeight - spacing / 2) / 2;

            let backRatio = backPDFImg.width / backPDFImg.height;
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

            pdf.addImage(frontPDFImg, "JPEG", frontX, frontY, frontWidth, frontHeight);
            pdf.addImage(backPDFImg, "JPEG", backX, backY, backWidth, backHeight);

            if (watermark) {
              pdf.setTextColor(180, 180, 180);
              pdf.setFontSize(50);
              pdf.text(watermark, a4Width / 2, a4Height / 2, { align: "center", angle: -45 });
            }

            pdf.save("civil-id.pdf");
          };
        };
      };
    };
  };

  const renderCorners = (corners, setCorners) => {
    return corners.map((corner, i) => (
      <Draggable
        key={i}
        bounds="parent"
        position={{ x: corner.x, y: corner.y }}
        onDrag={(e, data) => {
          const newCorners = [...corners];
          newCorners[i] = { x: data.x, y: data.y };
          setCorners(newCorners);
        }}
      >
        <div className="w-4 h-4 bg-red-500 rounded-full absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"></div>
      </Draggable>
    ));
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Civil ID Processor</h1>

      <div className="bg-white/40 shadow-2xl rounded-3xl p-8 w-full max-w-xl flex flex-col gap-6 border border-blue-200 border-opacity-30">
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
      </div>

      {frontPreview && (
        <div className="mt-8 w-full max-w-xl relative">
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">Adjust Front Corners</h2>
          <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
            <img ref={frontImgRef} src={frontPreview} alt="Front" className="w-full h-full object-contain" />
            {renderCorners(frontCorners, setFrontCorners)}
          </div>
        </div>
      )}

      {backPreview && (
        <div className="mt-8 w-full max-w-xl relative">
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">Adjust Back Corners</h2>
          <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
            <img ref={backImgRef} src={backPreview} alt="Back" className="w-full h-full object-contain" />
            {renderCorners(backCorners, setBackCorners)}
          </div>
        </div>
      )}

      {(frontPreview || backPreview) && (
        <button
          onClick={downloadPDF}
          className="mt-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
        >
          Download PDF
        </button>
      )}
    </div>
  );
}