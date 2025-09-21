"use client";
import jsPDF from "jspdf";
import React, { useState, useRef, useEffect } from "react";

function FreeformCropper({ src, onCropChange, initialCropData }) {
  const [corners, setCorners] = React.useState([]);
  const [draggingIndex, setDraggingIndex] = React.useState(null);
  const [dragPos, setDragPos] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const [magnifierImage, setMagnifierImage] = React.useState(null);

  const imgRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const magnifierCanvasRef = React.useRef(null);

  const magnifierSize = 100;
  const zoom = 2;
  const magnifierOffset = 20;

  // Initialize corners with saved data or default
  const initCorners = React.useCallback(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    
    if (initialCropData && initialCropData.corners) {
      setCorners(initialCropData.corners);
      setRotation(initialCropData.rotation || 0);
    } else {
      setCorners([
        { x: 0, y: 0 },
        { x: img.width, y: 0 },
        { x: img.width, y: img.height },
        { x: 0, y: img.height },
      ]);
    }
  }, [initialCropData]);

  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) initCorners();
    else img.onload = initCorners;
  }, [src, initCorners]);

  // Load image for magnifier
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setMagnifierImage(img);
    img.src = src;
  }, [src]);

  // Update magnifier canvas
  React.useEffect(() => {
    if (!magnifierCanvasRef.current || !magnifierImage || draggingIndex === null) return;
    
    const canvas = magnifierCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    
    if (!ctx || !img) return;
    
    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, magnifierSize, magnifierSize);
    
    // Calculate the area to draw from the source image
    const sourceX = dragPos.x - magnifierSize / (2 * zoom);
    const sourceY = dragPos.y - magnifierSize / (2 * zoom);
    const sourceWidth = magnifierSize / zoom;
    const sourceHeight = magnifierSize / zoom;
    
    // Only draw the part of the image that's within bounds
    if (sourceX < img.width && sourceY < img.height && 
        sourceX + sourceWidth > 0 && sourceY + sourceHeight > 0) {
      
      // Calculate the actual drawable area
      const drawX = Math.max(0, sourceX);
      const drawY = Math.max(0, sourceY);
      const drawWidth = Math.min(sourceWidth, img.width - drawX, sourceX + sourceWidth - drawX);
      const drawHeight = Math.min(sourceHeight, img.height - drawY, sourceY + sourceHeight - drawY);
      
      // Calculate where to draw on the canvas
      const canvasX = Math.max(0, (drawX - sourceX) * zoom);
      const canvasY = Math.max(0, (drawY - sourceY) * zoom);
      
      // Draw the image portion
      ctx.drawImage(
        magnifierImage,
        drawX * (magnifierImage.width / img.width),
        drawY * (magnifierImage.height / img.height),
        drawWidth * (magnifierImage.width / img.width),
        drawHeight * (magnifierImage.height / img.height),
        canvasX,
        canvasY,
        drawWidth * zoom,
        drawHeight * zoom
      );
    }
    
    // Draw crosshair
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(magnifierSize / 2, 0);
    ctx.lineTo(magnifierSize / 2, magnifierSize);
    ctx.moveTo(0, magnifierSize / 2);
    ctx.lineTo(magnifierSize, magnifierSize / 2);
    ctx.stroke();
  }, [dragPos, magnifierImage, draggingIndex]);

  const startDrag = (index) => (e) => {
    e.preventDefault();
    setDraggingIndex(index);
  };

  const stopDrag = React.useCallback(() => setDraggingIndex(null), []);

  const onDrag = React.useCallback(
    (e) => {
      if (draggingIndex === null || !containerRef.current || !imgRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : e.touches?.[0]?.clientX;
      const clientY = e.clientY !== undefined ? e.clientY : e.touches?.[0]?.clientY;
      if (clientX === undefined || clientY === undefined) return;

      // Clamp handle strictly inside image
      const x = Math.min(Math.max(clientX - rect.left, 0), imgRef.current.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), imgRef.current.height);

      setDragPos({ x, y });

      setCorners((prev) =>
        prev.map((c, i) => (i === draggingIndex ? { x, y } : c))
      );
    },
    [draggingIndex]
  );

  React.useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onDrag, { passive: false });
    window.addEventListener("touchend", stopDrag);
    
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onDrag);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [onDrag, stopDrag]);

  const handleCrop = () => {
    // Instead of cropping, just return the crop data
    onCropChange({ corners, rotation });
  };

  // Calculate magnifier position (offset from handle)
  const imgWidth = imgRef.current ? imgRef.current.width : 0;
  const imgHeight = imgRef.current ? imgRef.current.height : 0;
  
  // Position magnifier based on where the handle is in the image
  let magLeft = dragPos.x + magnifierOffset;
  let magTop = dragPos.y + magnifierOffset;
  
  // Adjust if near right or bottom edge
  if (magLeft + magnifierSize > imgWidth) {
    magLeft = dragPos.x - magnifierSize - magnifierOffset;
  }
  
  if (magTop + magnifierSize > imgHeight) {
    magTop = dragPos.y - magnifierSize - magnifierOffset;
  }

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <div className="relative" style={{ overflow: 'visible' }}>
        <img
          src={src}
          ref={imgRef}
          className="block w-full rounded-xl border border-blue-300 select-none"
          style={{ transform: `rotate(${rotation}deg)` }}
          alt="To crop"
        />

        {/* Polygon overlay - Made transparent */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
          <polygon
            points={corners.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="rgba(59,130,246,0.8)"
            strokeWidth={2}
          />
        </svg>

        {/* Draggable handles */}
        {corners.map((corner, idx) => (
          <div
            key={idx}
            onMouseDown={startDrag(idx)}
            onTouchStart={startDrag(idx)}
            className="absolute w-4 h-4 bg-blue-600 rounded-full cursor-grab select-none"
            style={{ left: corner.x - 8, top: corner.y - 8 }}
          />
        ))}

        {/* Magnifier */}
        {draggingIndex !== null && imgRef.current && (
          <div
            className="absolute border-2 border-blue-500 rounded-full overflow-hidden pointer-events-none bg-white select-none"
            style={{
              left: magLeft,
              top: magTop,
              width: magnifierSize,
              height: magnifierSize,
              zIndex: 1000,
              boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            }}
          >
            <canvas
              ref={magnifierCanvasRef}
              width={magnifierSize}
              height={magnifierSize}
            />
          </div>
        )}
      </div>

      {/* Rotation Slider */}
      <div className="flex justify-center mt-4 select-none">
        <input
          type="range"
          min={-180}
          max={180}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-1/2"
        />
      </div>

      <button
        onClick={handleCrop}
        className="mt-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-2 px-4 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 select-none"
      >
        Save Crop Settings
      </button>
    </div>
  );
}

// Main Civil ID Page
export default function CivilIdPage() {
  const [editingImage, setEditingImage] = useState(null);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [watermark, setWatermark] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Store crop data instead of cropped images
  const [frontCropData, setFrontCropData] = useState(null);
  const [backCropData, setBackCropData] = useState(null);
  
  // Store original images for processing
  const [originalFrontImage, setOriginalFrontImage] = useState(null);
  const [originalBackImage, setOriginalBackImage] = useState(null);

  const openCropper = (type) => {
    setEditingImage(type);
    document.body.style.overflow = "hidden";
  };

  const closeCropper = () => {
    setEditingImage(null);
    document.body.style.overflow = "auto";
  };

  const handleCropChange = (cropData, type) => {
    if (type === "front") {
      setFrontCropData(cropData);
      generatePreview(type, cropData);
    } else if (type === "back") {
      setBackCropData(cropData);
      generatePreview(type, cropData);
    }
    closeCropper();
  };

  const generatePreview = (type, cropData) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Create a temporary canvas to apply rotation
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      
      // Rotate the image first
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((cropData.rotation * Math.PI) / 180);
      tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);
      tempCtx.drawImage(img, 0, 0);
      
      // Now crop the rotated image
      const xs = cropData.corners.map((p) => p.x);
      const ys = cropData.corners.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const width = maxX - minX;
      const height = maxY - minY;

      canvas.width = width;
      canvas.height = height;
      
      // Draw only the cropped area
      ctx.drawImage(
        tempCanvas,
        minX, minY, width, height,
        0, 0, width, height
      );

      if (type === "front") {
        setFrontPreview(canvas.toDataURL("image/png"));
      } else {
        setBackPreview(canvas.toDataURL("image/png"));
      }
    };
    
    if (type === "front" && originalFrontImage) {
      img.src = originalFrontImage;
    } else if (type === "back" && originalBackImage) {
      img.src = originalBackImage;
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === "front") {
      setFrontFile(file);
      setOriginalFrontImage(previewUrl);
      setFrontPreview(previewUrl);
      setFrontCropData(null);
    } else {
      setBackFile(file);
      setOriginalBackImage(previewUrl);
      setBackPreview(previewUrl);
      setBackCropData(null);
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

      const res = await fetch(
        "https://civil-id-server.onrender.com/process-civil-id",
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      // Store the processed images but don't apply crop yet
      const frontProcessed = `data:image/jpeg;base64,${data.front}`;
      const backProcessed = `data:image/jpeg;base64,${data.back}`;
      
      // Update original images with processed ones
      setOriginalFrontImage(frontProcessed);
      setOriginalBackImage(backProcessed);
      
      // Show the processed images with default crop areas
      const defaultCropData = {
        corners: [
          { x: 0, y: 0 },
          { x: 500, y: 0 }, // Default width
          { x: 500, y: 300 }, // Default height
          { x: 0, y: 300 }
        ],
        rotation: 0
      };
      
      setFrontCropData(defaultCropData);
      setBackCropData(defaultCropData);
      
      // Generate previews with default crop areas
      generatePreview("front", defaultCropData);
      generatePreview("back", defaultCropData);
    } catch (e) {
      setError("Failed to process Civil ID. Try again.");
      console.error(e);
    }
    setLoading(false);
  };

  const applyCrop = (img, cropData) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(img.src);

      // Create a temporary canvas to apply rotation
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      
      // Rotate the image first
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((cropData.rotation * Math.PI) / 180);
      tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);
      tempCtx.drawImage(img, 0, 0);
      
      // Now crop the rotated image
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const xs = cropData.corners.map((p) => p.x * scaleX);
      const ys = cropData.corners.map((p) => p.y * scaleY);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      const width = maxX - minX;
      const height = maxY - minY;

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(tempCanvas, minX, minY, width, height, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    });
  };

  const downloadPDF = async () => {
    if (!frontPreview || !backPreview) return;

    setLoading(true);
    
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      const a4Width = 595;
      const a4Height = 842;
      const margin = 20;

      // Create images for cropping
      const frontImg = new Image();
      const backImg = new Image();
      
      // Apply crop if crop data exists
      let frontSrc = originalFrontImage;
      let backSrc = originalBackImage;
      
      if (frontCropData) {
        frontSrc = await new Promise((resolve) => {
          frontImg.onload = async () => {
            resolve(await applyCrop(frontImg, frontCropData));
          };
          frontImg.src = originalFrontImage;
        });
      }
      
      if (backCropData) {
        backSrc = await new Promise((resolve) => {
          backImg.onload = async () => {
            resolve(await applyCrop(backImg, backCropData));
          };
          backImg.src = originalBackImage;
        });
      }

      // Now load the cropped images
      const finalFrontImg = new Image();
      const finalBackImg = new Image();
      
      await new Promise((resolve) => {
        let loaded = 0;
        const checkLoaded = () => {
          loaded++;
          if (loaded === 2) resolve();
        };
        
        finalFrontImg.onload = checkLoaded;
        finalBackImg.onload = checkLoaded;
        
        finalFrontImg.src = frontSrc;
        finalBackImg.src = backSrc;
      });

      const availableHeight = a4Height - margin * 2;
      const spacing = availableHeight * 0.1;
      const maxImgHeight = (availableHeight - spacing) / 2 * 0.7;

      let frontRatio = finalFrontImg.width / finalFrontImg.height;
      let frontHeight = maxImgHeight;
      let frontWidth = frontHeight * frontRatio;
      if (frontWidth > a4Width - margin * 2) {
        frontWidth = a4Width - margin * 2;
        frontHeight = frontWidth / frontRatio;
      }
      const frontX = (a4Width - frontWidth) / 2;
      const frontY = margin + (availableHeight / 2 - frontHeight - spacing/2) / 2;

      let backRatio = finalBackImg.width / finalBackImg.height;
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

      pdf.addImage(finalFrontImg, "JPEG", frontX, frontY, frontWidth, frontHeight);
      pdf.addImage(finalBackImg, "JPEG", backX, backY, backWidth, backHeight);

      if (watermark) {
        pdf.setTextColor(180, 180, 180);
        pdf.setFontSize(50);
        pdf.text(watermark, a4Width / 2, a4Height / 2, { align: "center", angle: -45 });
      }

      pdf.save("civil-id.pdf");
    } catch (e) {
      console.error("Error creating PDF:", e);
      setError("Failed to create PDF. Please try again.");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (editingImage) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [editingImage]);

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

      {frontPreview && (
        <div className="relative mt-6">
          <img
            src={frontPreview}
            alt="Front"
            className="border border-blue-300 shadow-md rounded-xl max-w-full"
          />
          <button
            onClick={() => openCropper("front")}
            className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      )}

      {backPreview && (
        <div className="relative mt-6">
          <img
            src={backPreview}
            alt="Back"
            className="border border-blue-300 shadow-md rounded-xl max-w-full"
          />
          <button
            onClick={() => openCropper("back")}
            className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      )}
      
      {(frontPreview || backPreview) && (
        <button
          onClick={downloadPDF}
          disabled={loading}
          className="mt-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 w-full max-w-xl"
        >
          {loading ? "Downloading PDF..." : "Download PDF"}
        </button>
      )}
      
      {editingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 select-none"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            overflow: 'hidden'
          }}
          onTouchMove={(e) => {
            const isBackground = e.target === e.currentTarget;
            const isModalContent = e.target.closest('.modal-content');
            
            if (isBackground || isModalContent) {
              e.preventDefault();
            }
          }}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto modal-content select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Edit Image</h2>
            <FreeformCropper
              src={editingImage === "front" ? originalFrontImage : originalBackImage}
              initialCropData={editingImage === "front" ? frontCropData : backCropData}
              onCropChange={(cropData) => handleCropChange(cropData, editingImage)}
            />
            <button
              onClick={closeCropper}
              className="mt-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-6 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 select-none"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}