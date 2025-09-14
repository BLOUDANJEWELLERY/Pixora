import { useState } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgFile, setBgFile] = useState(null);
  const [bgOption, setBgOption] = useState("transparent"); // "transparent", "color", "image"
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setProcessedUrl(null);
    }
  };

  const handleBgFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setBgFile(file);
  };

  const processImage = async () => {
    if (!inputImage) return alert("Please upload an image");

    setLoading(true);

    try {
      // Remove background (transparent)
      const fgBlob = await removeBackground(inputImage);
      const fgBitmap = await createImageBitmap(fgBlob);

      const canvas = document.createElement("canvas");
      canvas.width = fgBitmap.width;
      canvas.height = fgBitmap.height;
      const ctx = canvas.getContext("2d");

      // Apply background
      if (bgOption === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgOption === "image" && bgFile) {
        const bgBitmap = await createImageBitmap(bgFile);
        // Draw background stretched to canvas
        ctx.drawImage(bgBitmap, 0, 0, canvas.width, canvas.height);
      } 
      // else transparent -> do nothing

      // Draw foreground on top
      ctx.drawImage(fgBitmap, 0, 0);

      // Convert canvas to URL
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setProcessedUrl(url);
        setLoading(false);
      }, "image/png");
    } catch (err) {
      console.error(err);
      alert("Failed: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h1>Background Remover & Replacer</h1>

      {/* Upload Image */}
      <div>
        <label>Upload Image:</label><br />
        <input type="file" accept="image/*" onChange={handleInputChange} />
      </div>

      {/* Background options */}
      <div style={{ marginTop: 15 }}>
        <label>Background Option:</label><br />
        <select value={bgOption} onChange={(e) => setBgOption(e.target.value)}>
          <option value="transparent">Transparent</option>
          <option value="color">Solid Color</option>
          <option value="image">Image</option>
        </select>
      </div>

      {bgOption === "color" && (
        <div style={{ marginTop: 10 }}>
          <label>Pick Color:</label><br />
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
        </div>
      )}

      {bgOption === "image" && (
        <div style={{ marginTop: 10 }}>
          <label>Upload Background Image:</label><br />
          <input type="file" accept="image/*" onChange={handleBgFileChange} />
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={processImage} disabled={loading}>
          {loading ? "Processing..." : "Process Image"}
        </button>
      </div>

      {/* Result */}
      {processedUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Result:</h3>
          <img src={processedUrl} alt="Processed" style={{ maxWidth: "100%" }} />
          <br />
          <a href={processedUrl} download="output.png">Download Image</a>
        </div>
      )}
    </div>
  );
}