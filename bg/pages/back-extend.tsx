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

      // Optionally blur the whole canvas first
      if (blur) ctx.filter = "blur(10px)";

      // Fill extended background with repeated edges
      // Draw main image centered
      ctx.filter = blur ? "blur(10px)" : "none"; // main image stays sharp if no blur
      ctx.drawImage(img, padding, padding);

      // Repeat top and bottom edges
      const topEdge = ctx.getImageData(padding, padding, img.width, 1);
      const bottomEdge = ctx.getImageData(padding, padding + img.height - 1, img.width, 1);

      for (let y = 0; y < padding; y++) {
        ctx.putImageData(topEdge, padding, y);
        ctx.putImageData(bottomEdge, padding, canvas.height - padding + y);
      }

      // Repeat left and right edges
      const leftEdge = ctx.getImageData(padding, padding, 1, img.height);
      const rightEdge = ctx.getImageData(padding + img.width - 1, padding, 1, img.height);

      for (let x = 0; x < padding; x++) {
        ctx.putImageData(leftEdge, x, padding);
        ctx.putImageData(rightEdge, canvas.width - padding + x, padding);
      }

      // Fill corners
      const topLeft = ctx.getImageData(padding, padding, 1, 1);
      const topRight = ctx.getImageData(padding + img.width - 1, padding, 1, 1);
      const bottomLeft = ctx.getImageData(padding, padding + img.height - 1, 1, 1);
      const bottomRight = ctx.getImageData(padding + img.width - 1, padding + img.height - 1, 1, 1);

      for (let x = 0; x < padding; x++) {
        for (let y = 0; y < padding; y++) {
          ctx.putImageData(topLeft, x, y);
          ctx.putImageData(topRight, canvas.width - padding + x, y);
          ctx.putImageData(bottomLeft, x, canvas.height - padding + y);
          ctx.putImageData(bottomRight, canvas.width - padding + x, canvas.height - padding + y);
        }
      }

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
                max={300}
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                style={{ marginLeft: "10px" }}
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