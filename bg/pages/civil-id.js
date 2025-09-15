import { useState, useRef } from "react";
import jsPDF from "jspdf";

export default function CivilIdPage() {
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [watermark, setWatermark] = useState("");
  const [processed, setProcessed] = useState(false);
  const canvasRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (type === "front") setFrontFile(file);
    if (type === "back") setBackFile(file);
  };

  const processImages = async () => {
    if (!frontFile || !backFile) {
      alert("Upload both front and back images first");
      return;
    }

    const frontImg = await createImageBitmap(frontFile);
    const backImg = await createImageBitmap(backFile);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // A4 at 300dpi ≈ 2480x3508px
    canvas.width = 2480;
    canvas.height = 3508;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Place front at top
    const idWidth = 2000;
    const idHeight = (frontImg.height / frontImg.width) * idWidth;
    ctx.drawImage(frontImg, 240, 200, idWidth, idHeight);

    // Place back at bottom
    const backHeight = (backImg.height / backImg.width) * idWidth;
    ctx.drawImage(backImg, 240, 200 + idHeight + 200, idWidth, backHeight);

    // Add optional watermark
    if (watermark) {
      ctx.save();
      ctx.font = "80px Arial";
      ctx.fillStyle = "rgba(150,150,150,0.15)";
      ctx.textAlign = "center";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // diagonal
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
    pdf.addImage(imgData, "JPEG", 0, 0, 595, 842); // A4 in points
    pdf.save("civil-id.pdf");
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
          onClick={processImages}
          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
        >
          Process Civil ID
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