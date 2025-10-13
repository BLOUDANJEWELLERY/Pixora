"use client";
import { useState } from "react";
import Header from "../components/Header";

type ResizeMode = "stretch" | "extend";

export default function ImageResizer() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [resized, setResized] = useState<string | null>(null);
  const [mode, setMode] = useState<ResizeMode>("stretch");
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const url = URL.createObjectURL(file);
    setPreview(url);

    const img = new Image();
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setOriginalDimensions({ width: img.width, height: img.height });
    };
    img.src = url;
  };

  const getEdgePixels = (imageData: ImageData, width: number, height: number) => {
    const edges = {
      top: [],
      bottom: [],
      left: [],
      right: []
    } as {
      top: number[][],
      bottom: number[][],
      left: number[][],
      right: number[][]
    };

    // Top edge (first row)
    for (let x = 0; x < width; x++) {
      const index = (0 * width + x) * 4;
      edges.top.push([
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]);
    }

    // Bottom edge (last row)
    for (let x = 0; x < width; x++) {
      const index = ((height - 1) * width + x) * 4;
      edges.bottom.push([
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]);
    }

    // Left edge (first column)
    for (let y = 0; y < height; y++) {
      const index = (y * width + 0) * 4;
      edges.left.push([
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]);
    }

    // Right edge (last column)
    for (let y = 0; y < height; y++) {
      const index = (y * width + (width - 1)) * 4;
      edges.right.push([
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]);
    }

    return edges;
  };

  const handleResize = () => {
    if (!image || !width || !height || !originalDimensions) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      if (mode === "stretch") {
        // Default mode - stretch the image
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        // Background extender mode
        const originalAspect = originalDimensions.width / originalDimensions.height;
        const targetAspect = width / height;

        if (Math.abs(originalAspect - targetAspect) < 0.01) {
          // Same aspect ratio, just resize
          ctx.drawImage(img, 0, 0, width, height);
        } else {
          // Different aspect ratio - extend background
          const scale = Math.min(
            width / originalDimensions.width,
            height / originalDimensions.height
          );

          const scaledWidth = originalDimensions.width * scale;
          const scaledHeight = originalDimensions.height * scale;

          const xOffset = (width - scaledWidth) / 2;
          const yOffset = (height - scaledHeight) / 2;

          // Create a temporary canvas to get edge pixels
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = originalDimensions.width;
          tempCanvas.height = originalDimensions.height;
          const tempCtx = tempCanvas.getContext("2d");
          
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, originalDimensions.width, originalDimensions.height);
            const imageData = tempCtx.getImageData(0, 0, originalDimensions.width, originalDimensions.height);
            const edges = getEdgePixels(imageData, originalDimensions.width, originalDimensions.height);

            // Fill the entire canvas with extended background
            // Top area
            for (let y = 0; y < yOffset; y++) {
              const edgePixel = edges.top[Math.floor((y / yOffset) * edges.top.length) % edges.top.length];
              ctx.fillStyle = `rgba(${edgePixel[0]}, ${edgePixel[1]}, ${edgePixel[2]}, ${edgePixel[3] / 255})`;
              ctx.fillRect(0, y, width, 1);
            }

            // Bottom area
            for (let y = height - yOffset; y < height; y++) {
              const edgePixel = edges.bottom[Math.floor(((y - (height - yOffset)) / yOffset) * edges.bottom.length) % edges.bottom.length];
              ctx.fillStyle = `rgba(${edgePixel[0]}, ${edgePixel[1]}, ${edgePixel[2]}, ${edgePixel[3] / 255})`;
              ctx.fillRect(0, y, width, 1);
            }

            // Left area
            for (let x = 0; x < xOffset; x++) {
              const edgePixel = edges.left[Math.floor((x / xOffset) * edges.left.length) % edges.left.length];
              ctx.fillStyle = `rgba(${edgePixel[0]}, ${edgePixel[1]}, ${edgePixel[2]}, ${edgePixel[3] / 255})`;
              ctx.fillRect(x, yOffset, 1, scaledHeight);
            }

            // Right area
            for (let x = width - xOffset; x < width; x++) {
              const edgePixel = edges.right[Math.floor(((x - (width - xOffset)) / xOffset) * edges.right.length) % edges.right.length];
              ctx.fillStyle = `rgba(${edgePixel[0]}, ${edgePixel[1]}, ${edgePixel[2]}, ${edgePixel[3] / 255})`;
              ctx.fillRect(x, yOffset, 1, scaledHeight);
            }

            // Draw the original image scaled in the center
            ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);
          }
        }
      }

      const resizedUrl = canvas.toDataURL("image/png");
      setResized(resizedUrl);
    };
    img.src = URL.createObjectURL(image);
  };

  const handleDownload = () => {
    if (!resized) return;
    const a = document.createElement("a");
    a.href = resized;
    a.download = "resized-image.png";
    a.click();
  };

  // Check if background extension mode should be available
  const shouldShowExtendMode = originalDimensions && width && height && 
    Math.abs((originalDimensions.width / originalDimensions.height) - (width / height)) > 0.01;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-lg">
          Image Resizer
        </h1>

        <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-blue-200 border-opacity-30 flex flex-col items-center w-full max-w-md gap-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-blue-900 cursor-pointer"
          />

          {preview && (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />

              <div className="flex gap-4">
                <div>
                  <label className="text-sm text-blue-900">Width</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>

                <div>
                  <label className="text-sm text-blue-900">Height</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value))}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>
              </div>

              {/* Mode selector - only show when aspect ratios differ */}
              {shouldShowExtendMode && (
                <div className="w-full">
                  <label className="text-sm text-blue-900 block mb-2">Resize Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="stretch"
                        checked={mode === "stretch"}
                        onChange={(e) => setMode(e.target.value as ResizeMode)}
                        className="mr-2"
                      />
                      Stretch
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="extend"
                        checked={mode === "extend"}
                        onChange={(e) => setMode(e.target.value as ResizeMode)}
                        className="mr-2"
                      />
                      Background Extender
                    </label>
                  </div>
                  {mode === "extend" && (
                    <p className="text-xs text-blue-600 mt-2">
                      The image borders will be extended to fill the space
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleResize}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all"
              >
                Resize Image
              </button>
            </>
          )}

          {resized && (
            <div className="flex flex-col items-center gap-4 mt-6">
              <img
                src={resized}
                alt="Resized"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all"
              >
                Download Resized Image
              </button>
            </div>
          )}
        </div>

        <p className="text-blue-900 text-sm mt-12">
          Resize images instantly — no quality loss, no waiting.
        </p>
      </div>
    </>
  );
}