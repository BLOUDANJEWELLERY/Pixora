import { useState } from "react";
import removeBg from "@imgly/background-removal";

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImage, setBgImage] = useState(null);
  const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setProcessedBlobUrl(null);
    }
  };

  const handleBgImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBgImage(file);
    }
  };

  const processImage = async () => {
    if (!inputImage) {
      alert("Please upload an image");
      return;
    }

    setLoading(true);

    try {
      // Read input image as ArrayBuffer or Blob
      const inputArrayBuffer = await inputImage.arrayBuffer();

      // Remove background
      const resultBlob = await removeBg(inputArrayBuffer);

      // resultBlob is a Blob (PNG) with transparent background

      // Now composite with background color or background image
      const fgBitmap = await createImageBitmap(resultBlob);
      const canvas = document.createElement("canvas");
      canvas.width = fgBitmap.width;
      canvas.height = fgBitmap.height;
      const ctx = canvas.getContext("2d");

      // background: either image or color
      if (bgImage) {
        const bgBitmap = await createImageBitmap(bgImage);
        // draw the background image stretched or centered — adapt as you like
        ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // then draw the foreground (cut out)
      ctx.drawImage(fgBitmap, 0, 0);

      // get final image as Blob URL
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setProcessedBlobUrl(url);
        setLoading(false);
      }, "image/png");

    } catch (err) {
      console.error("Error removing background:", err);
      alert("Failed to process image: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Free Background Remover</h1>

      <div>
        <label>Upload Image:</label><br/>
        <input type="file" accept="image/*" onChange={handleInputImageChange} />
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Background Color:</label><br/>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Or Upload Background Image:</label><br/>
        <input type="file" accept="image/*" onChange={handleBgImageChange} />
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={processImage} disabled={loading}>
          {loading ? "Processing..." : "Run"}
        </button>
      </div>

      {processedBlobUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Result:</h3>
          <img src={processedBlobUrl} alt="Processed" style={{ maxWidth: "100%" }} />
          <br/>
          <a href={processedBlobUrl} download="output.png">Download Final</a>
        </div>
      )}
    </div>
  );
}