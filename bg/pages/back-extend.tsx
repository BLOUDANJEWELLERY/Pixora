"use client";

import { useState } from "react";

export default function EdgeExtendBackground() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setResult(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleExtendBackground = () => {
    if (!image) return;

    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      const padding = 100; // extra background pixels
      const canvas = document.createElement("canvas");
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw main image in center
      ctx.drawImage(img, padding, padding);

      // Repeat top and bottom edges
      const topEdge = ctx.getImageData(padding, padding, img.width, 1);
      const bottomEdge = ctx.getImageData(padding, padding + img.height - 1, img.width, 1);

      for (let y = 0; y < padding; y++) {
        ctx.putImageData(topEdge, padding, y); // top
        ctx.putImageData(bottomEdge, padding, canvas.height - padding + y); // bottom
      }

      // Repeat left and right edges
      const leftEdge = ctx.getImageData(padding, padding, 1, img.height);
      const rightEdge = ctx.getImageData(padding + img.width - 1, padding, 1, img.height);

      for (let x = 0; x < padding; x++) {
        ctx.putImageData(leftEdge, x, padding); // left
        ctx.putImageData(rightEdge, canvas.width - padding + x, padding); // right
      }

      // Fill corners with the nearest pixels for smoother look
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
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Edge Repeated Background Extender</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />

      {image && (
        <button onClick={handleExtendBackground} style={{ marginTop: "10px" }}>
          Extend Background
        </button>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Result:</h2>
          <img src={result} alt="Extended" style={{ maxWidth: "500px" }} />
        </div>
      )}
    </div>
  );
}