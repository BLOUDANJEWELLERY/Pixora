"use client";

import { useState, useEffect } from "react";

export default function EdgeExtendBackground() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [padding, setPadding] = useState<number>(100);
  const [blur, setBlur] = useState<boolean>(false);
  const [edgeSize, setEdgeSize] = useState<number>(50); // default edge strip

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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Limit edgeSize so it does not exceed image dimensions
      const stripW = Math.min(edgeSize, img.width);
      const stripH = Math.min(edgeSize, img.height);

      const copyStrip = (
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

      // Top and bottom
      copyStrip(0, 0, img.width, stripH, padding, 0, img.width, padding); // top
      copyStrip(0, img.height - stripH, img.width, stripH, padding, canvas.height - padding, img.width, padding); // bottom

      // Left and right
      copyStrip(0, 0, stripW, img.height, 0, padding, padding, img.height); // left
      copyStrip(img.width - stripW, 0, stripW, img.height, canvas.width - padding, padding, padding, img.height); // right

      // Corners
      copyStrip(0, 0, stripW, stripH, 0, 0, padding, padding); // top-left
      copyStrip(img.width - stripW, 0, stripW, stripH, canvas.width - padding, 0, padding, padding); // top-right
      copyStrip(0, img.height - stripH, stripW, stripH, 0, canvas.height - padding, padding, padding); // bottom-left
      copyStrip(img.width - stripW, img.height - stripH, stripW, stripH, canvas.width - padding, canvas.height - padding, padding, padding); // bottom-right

      // Draw main image centered
      ctx.filter = blur ? "blur(10px)" : "none";
      ctx.drawImage(img, padding, padding);

      setResult(canvas.toDataURL("image/png"));
    };
  }, [image, padding, blur, edgeSize]);

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = "extended-image.png";
    link.click();
  };

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
              Edge strip size: {edgeSize}px
              <input
                type="range"
                min={10}
                max={Math.min(300, image ? Math.min(image.width, image.height) : 300)}
                value={edgeSize}
                onChange={(e) => setEdgeSize(parseInt(e.target.value))}
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

          {result && (
            <button onClick={handleDownload} style={{ marginTop: "15px" }}>
              Download Extended Image
            </button>
          )}
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