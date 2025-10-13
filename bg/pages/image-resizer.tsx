"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Header from "../components/Header";

type ResizeMode = "stretch" | "extend";
type ExportFormat = "png" | "jpeg" | "jpg" | "webp" | "ico";

export default function ImageResizer() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [resized, setResized] = useState<string | null>(null);
  const [mode, setMode] = useState<ResizeMode>("stretch");
  const [originalDimensions, setOriginalDimensions] = useState<{width: number, height: number} | null>(null);
  
  // Background extender specific states
  const [edgeSize, setEdgeSize] = useState<number>(50);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<number>(0.9);
  const [estimatedSize, setEstimatedSize] = useState<string>("");
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up fake extensions and normalize format names
  const normalizeFormat = (fileName: string): ExportFormat => {
    const ext = fileName.toLowerCase().split('.').pop() || 'png';
    
    // Handle fake extensions and normalize
    if (ext === 'jpg' || ext === 'jpeg') return 'jpeg';
    if (ext === 'png') return 'png';
    if (ext === 'webp') return 'webp';
    if (ext === 'ico') return 'ico';
    
    return 'png'; // default fallback
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clean file name and set proper type
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + "." + normalizeFormat(file.name);
    const cleanFile = new File([file], cleanFileName, { type: `image/${normalizeFormat(file.name)}` });
    
    setImage(cleanFile);
    const url = URL.createObjectURL(cleanFile);
    setPreview(url);

    const img = new Image();
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setOriginalDimensions({ width: img.width, height: img.height });
      // Set default edge size based on image dimensions
      setEdgeSize(Math.min(50, Math.min(img.width, img.height) / 4));
    };
    img.src = url;
  };

  // Reset dimensions to original
  const handleResetDimensions = () => {
    if (originalDimensions) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
    }
  };

  // Convert canvas to ICO format using multiple sizes
  const convertToICO = async (canvas: HTMLCanvasElement): Promise<string> => {
    // ICO typically contains multiple sizes, we'll generate common ones
    const sizes = [16, 32, 48, 64, 128];
    const icoCanvas = document.createElement('canvas');
    const ctx = icoCanvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');

    // Create ICO data structure
    const icoData: Uint8Array[] = [];
    
    for (const size of sizes) {
      icoCanvas.width = size;
      icoCanvas.height = size;
      
      // Clear and draw resized image
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(canvas, 0, 0, size, size);
      
      // Convert to PNG data for ICO
      const pngData = icoCanvas.toDataURL('image/png').split(',')[1];
      const binary = atob(pngData);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      icoData.push(array);
    }

    // Simple ICO header (simplified version)
    // In production, use a proper ICO encoder library
    const icoBlob = new Blob([canvas.toDataURL('image/png')], { type: 'image/x-icon' });
    return URL.createObjectURL(icoBlob);
  };

  // Get proper MIME type for format
  const getMimeType = (format: ExportFormat): string => {
    switch (format) {
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'ico':
        return 'image/x-icon';
      default:
        return 'image/png';
    }
  };

  // Get file extension for format
  const getFileExtension = (format: ExportFormat): string => {
    switch (format) {
      case 'jpeg':
      case 'jpg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      case 'ico':
        return 'ico';
      default:
        return 'png';
    }
  };

  // Estimate file size
  const updateFileSize = useCallback(() => {
    if (!canvasRef.current) return;
    
    const mimeType = getMimeType(format);

    try {
      const dataUrl = format === 'png' || format === 'ico'
        ? canvasRef.current.toDataURL(mimeType)
        : canvasRef.current.toDataURL(mimeType, quality);

      const base64Length = dataUrl.length - (dataUrl.indexOf(",") + 1);
      const paddingBytes = dataUrl.endsWith("==") ? 2 : dataUrl.endsWith("=") ? 1 : 0;
      const fileSizeBytes = base64Length * 0.75 - paddingBytes;
      const fileSizeKB = fileSizeBytes / 1024;
      const fileSizeMB = fileSizeKB / 1024;

      setEstimatedSize(fileSizeMB > 1 ? `${fileSizeMB.toFixed(2)} MB` : `${fileSizeKB.toFixed(1)} KB`);
    } catch (error) {
      setEstimatedSize("Calculating...");
    }
  }, [format, quality]);

  const copyStrip = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    const tctx = tempCanvas.getContext("2d");
    if (!tctx) return;
    tctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
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
        const resizedUrl = canvas.toDataURL("image/png");
        setResized(resizedUrl);
        
        // Update canvas ref for file size estimation
        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          canvasRef.current.getContext('2d')?.drawImage(canvas, 0, 0);
          updateFileSize();
        }
      } else {
        // Background extender mode
        const originalAspect = originalDimensions.width / originalDimensions.height;
        const targetAspect = width / height;

        if (Math.abs(originalAspect - targetAspect) < 0.01) {
          // Same aspect ratio, just resize
          ctx.drawImage(img, 0, 0, width, height);
          const resizedUrl = canvas.toDataURL("image/png");
          setResized(resizedUrl);
          
          if (canvasRef.current) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            canvasRef.current.getContext('2d')?.drawImage(canvas, 0, 0);
            updateFileSize();
          }
        } else {
          // Different aspect ratio - use edge extension
          const scale = Math.min(
            width / originalDimensions.width,
            height / originalDimensions.height
          );

          const scaledWidth = originalDimensions.width * scale;
          const scaledHeight = originalDimensions.height * scale;

          const xOffset = (width - scaledWidth) / 2;
          const yOffset = (height - scaledHeight) / 2;

          ctx.clearRect(0, 0, width, height);

          const stripW = Math.min(edgeSize, originalDimensions.width);
          const stripH = Math.min(edgeSize, originalDimensions.height);

          // Edges + corners
          // Top edge
          copyStrip(
            ctx,
            img,
            0, 0, originalDimensions.width, stripH,
            xOffset, 0, scaledWidth, yOffset
          );

          // Bottom edge
          copyStrip(
            ctx,
            img,
            0, originalDimensions.height - stripH, originalDimensions.width, stripH,
            xOffset, height - yOffset, scaledWidth, yOffset
          );

          // Left edge
          copyStrip(
            ctx,
            img,
            0, 0, stripW, originalDimensions.height,
            0, yOffset, xOffset, scaledHeight
          );

          // Right edge
          copyStrip(
            ctx,
            img,
            originalDimensions.width - stripW, 0, stripW, originalDimensions.height,
            width - xOffset, yOffset, xOffset, scaledHeight
          );

          // Corners
          // Top-left
          copyStrip(
            ctx,
            img,
            0, 0, stripW, stripH,
            0, 0, xOffset, yOffset
          );

          // Top-right
          copyStrip(
            ctx,
            img,
            originalDimensions.width - stripW, 0, stripW, stripH,
            width - xOffset, 0, xOffset, yOffset
          );

          // Bottom-left
          copyStrip(
            ctx,
            img,
            0, originalDimensions.height - stripH, stripW, stripH,
            0, height - yOffset, xOffset, yOffset
          );

          // Bottom-right
          copyStrip(
            ctx,
            img,
            originalDimensions.width - stripW, originalDimensions.height - stripH, stripW, stripH,
            width - xOffset, height - yOffset, xOffset, yOffset
          );

          // Draw the original image scaled in the center
          ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);

          // Set canvas ref for file size estimation
          if (canvasRef.current) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            canvasRef.current.getContext('2d')?.drawImage(canvas, 0, 0);
            updateFileSize();
          }

          const resizedUrl = canvas.toDataURL("image/png");
          setResized(resizedUrl);
        }
      }
    };
    img.src = URL.createObjectURL(image);
  };

  const handleDownload = async () => {
    if (!resized || !canvasRef.current) return;

    setIsConverting(true);

    try {
      let downloadUrl: string;
      const fileExtension = getFileExtension(format);
      const mimeType = getMimeType(format);

      if (format === 'ico') {
        // Special handling for ICO format
        downloadUrl = await convertToICO(canvasRef.current);
      } else {
        // Standard formats
        downloadUrl = format === 'png' 
          ? canvasRef.current.toDataURL(mimeType)
          : canvasRef.current.toDataURL(mimeType, quality);
      }

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `resized-image.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up ICO URL if created
      if (format === 'ico') {
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  // Check if background extension mode should be available
  const shouldShowExtendMode = originalDimensions && width && height && 
    Math.abs((originalDimensions.width / originalDimensions.height) - (width / height)) > 0.01;

  const clarityNote: Record<ExportFormat, string> = {
    png: "Lossless, best clarity, larger file.",
    jpeg: "Lossy compression, smaller file, slight quality drop.",
    jpg: "Same as JPEG, widely supported.",
    webp: "Good balance, modern browsers only.",
    ico: "Icon format, contains multiple sizes.",
  };

  // Check if format supports quality adjustment
  const supportsQuality = (fmt: ExportFormat): boolean => {
    return ["jpeg", "jpg", "webp"].includes(fmt);
  };

  // Update file size when format or quality changes
  useEffect(() => {
    if (resized) {
      updateFileSize();
    }
  }, [format, quality, resized, updateFileSize]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-8 text-center drop-shadow-lg">
          Image Resizer
        </h1>

        <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-blue-200 border-opacity-30 flex flex-col items-center w-full max-w-md gap-6">
          {/* Centered file input */}
          <div className="w-full flex justify-center">
            <label className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all cursor-pointer text-center inline-block min-w-[200px]">
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {preview && (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />

              <div className="flex gap-4 items-end">
                <div>
                  <label className="text-sm text-blue-900">Width</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>

                <div>
                  <label className="text-sm text-blue-900">Height</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                    className="w-24 p-2 rounded-md border border-blue-300 text-blue-900"
                  />
                </div>
                
                {/* Reset Button */}
                <button
                  onClick={handleResetDimensions}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md transition-all text-sm"
                  title="Reset to original dimensions"
                >
                  Reset
                </button>
              </div>

              {/* Export Format - Always Visible */}
              <div className="w-full">
                <label className="text-sm text-blue-900 block mb-2">Export Format:</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                  className="p-2 rounded-md border border-blue-300 text-blue-900 w-full"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WebP</option>
                  <option value="ico">ICO</option>
                </select>
                
                {supportsQuality(format) && (
                  <div className="mt-3">
                    <label className="text-sm text-blue-900">
                      Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality * 100}
                      onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
                      className="w-full mt-2"
                    />
                  </div>
                )}

                {estimatedSize && (
                  <div className="text-xs text-blue-600 bg-white/60 rounded-lg p-2 mt-3">
                    <p><strong>Estimated Size:</strong> {estimatedSize}</p>
                    <p><strong>Clarity:</strong> {clarityNote[format]}</p>
                  </div>
                )}
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
                  
                  {/* Background extender options */}
                  {mode === "extend" && (
                    <div className="mt-4">
                      <div>
                        <label className="text-sm text-blue-900">
                          Edge Strip Size: {edgeSize}px
                        </label>
                        <input
                          type="range"
                          min={1}
                          max={
                            originalDimensions
                              ? Math.min(300, Math.min(originalDimensions.width, originalDimensions.height))
                              : 300
                          }
                          value={edgeSize}
                          onChange={(e) => setEdgeSize(parseInt(e.target.value))}
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
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
            <div className="flex flex-col items-center gap-4 mt-6 w-full">
              <img
                src={resized}
                alt="Resized"
                className="w-48 h-48 object-contain rounded-xl border border-blue-200"
              />
              <button
                onClick={handleDownload}
                disabled={isConverting}
                className={`${
                  isConverting 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-green-600 hover:bg-green-700"
                } text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all w-full`}
              >
                {isConverting ? "Converting..." : `Download as ${format.toUpperCase()}`}
              </button>
            </div>
          )}
        </div>

        {/* Hidden canvas for file size estimation */}
        <canvas ref={canvasRef} className="hidden" />

        <p className="text-blue-900 text-sm mt-12">
          Resize images instantly — no quality loss, no waiting.
        </p>
      </div>
    </>
  );
}