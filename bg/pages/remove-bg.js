import { useState } from "react";

export default function RemoveBgPage() {
  const [file, setFile] = useState(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProcessedImage(null);
  };

  const handleProcess = async () => {
    if (!file) return alert("Please upload an image");

    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];

      try {
        const res = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, bgColor }),
        });

        if (!res.ok) throw new Error("Failed to process image");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setProcessedImage(url);
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        Background Remover
      </h1>

      <input type="file" accept="image/*" onChange={handleFileChange} />
      <div style={{ margin: "20px 0" }}>
        <label>Choose Background Color: </label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
        />
      </div>

      <button
        onClick={handleProcess}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: "#0b1a3d",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {loading ? "Processing..." : "Remove Background"}
      </button>

      {processedImage && (
        <div style={{ marginTop: "20px" }}>
          <h2>Processed Image:</h2>
          <img
            src={processedImage}
            alt="Processed"
            style={{ maxWidth: "100%", border: "1px solid #ccc" }}
          />
          <div style={{ marginTop: "10px" }}>
            <a
              href={processedImage}
              download="processed.png"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "#c7a332",
                color: "#fff",
                borderRadius: "5px",
                textDecoration: "none",
              }}
            >
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}