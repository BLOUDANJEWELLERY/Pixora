"use client";

import { useState, useEffect } from "react";

export default function EdgeExtendBackground() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [padding, setPadding] = useState<number>(100);
  const [blur, setBlur] = useState<boolean>(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!image) return;

    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill background with repeated edges
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Helper function to copy a strip from source
      const copyStrip = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = sw;
        tempCanvas.height = sh;
        const tctx = tempCanvas.getContext("2d");
        if (!tctx) return;
        tctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        ctx.drawImage(tempCanvas, 0, 0, sw, sh, dx, dy, dw, dh);
      };

      const edgeWidth = Math.min(100, img.width);
      const edgeHeight = Math.min(100, img.height);

      // Top
      copyStrip(0, 0, img.width, edgeHeight, padding, 0, img.width, padding);
      // Bottom
      copyStrip(0, img.height - edgeHeight, img.width, edgeHeight, padding, canvas.height - padding, img.width, padding);
      // Left
      copyStrip(0, 0, edgeWidth, img.height, 0, padding, padding, img.height);
      // Right
      copyStrip(img.width - edgeWidth, 0, edgeWidth, img.height, canvas.width - padding, padding, padding, img.height);
      // Corners
      copyStrip(0, 0, edgeWidth, edgeHeight, 0, 0, padding, padding); // top-left
      copyStrip(img.width - edgeWidth, 0, edgeWidth, edgeHeight, canvas.width - padding, 0, padding, padding); // top-right
      copyStrip(0, img.height - edgeHeight, edgeWidth, edgeHeight, 0, canvas.height - padding, padding, padding); // bottom-left
      copyStrip(img.width - edgeWidth, img.height - edgeHeight, edgeWidth, edgeHeight, canvas.width - padding, canvas.height - padding, padding, padding); // bottom-right

      // Draw main image in center
      ctx.filter = blur ? "blur(10px)" : "none";
      ctx.drawImage(img, padding, padding);

      setResult(canvas.toDataURL("image/png"));
    };
  }, [image, padding, blur]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Edge Repeated Background Extender</h1>

      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && (
        <>
          <div style={{ marginTop: "10px" }}>
            <label>
              Background padding: {padding}px
              <input
                type="range"
                min={10}
                max={1000}
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                style={{ marginLeft: "10px", width: "300px" }}
              />
            </label>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label>
              <input
                type="checkbox"
                checked={blur}
                onChange={() => setBlur(!blur)}
                style={{ marginRight: "5px" }}
              />
              Blur background
            </label>
          </div>
        </>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Live Preview:</h2>
          <img src={result} alt="Extended" style={{ maxWidth: "500px" }} />
        </div>
      )}
    </div>
  );
}