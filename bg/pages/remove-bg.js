import { useState } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function RemoveBgPage() {
  const [inputImage, setInputImage] = useState(null);
  const [processedBlobUrl, setProcessedBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInputImage(file);
      setProcessedBlobUrl(null);
    }
  };

  const processImage = async () => {
    if (!inputImage) {
      alert("Please upload an image");
      return;
    }

    setLoading(true);
    try {
      // ✅ Pass File directly
      const resultBlob = await removeBackground(inputImage);

      const url = URL.createObjectURL(resultBlob);
      setProcessedBlobUrl(url);
    } catch (err) {
      console.error("Error removing background:", err);
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Free Background Remover</h1>

      <input type="file" accept="image/*" onChange={handleInputImageChange} />
      <button onClick={processImage} disabled={loading}>
        {loading ? "Processing..." : "Remove Background"}
      </button>

      {processedBlobUrl && (
        <div style={{ marginTop: 20 }}>
          <img src={processedBlobUrl} alt="Processed" style={{ maxWidth: "100%" }} />
          <a href={processedBlobUrl} download="output.png">Download</a>
        </div>
      )}
    </div>
  );
}