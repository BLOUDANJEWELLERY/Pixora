import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const enhanceImage = async () => {
    if (!file) return alert("Select an image first");
    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("https://enhancer-g31v.onrender.com/enhance", {
        method: "POST",
        body: form,
      });
      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));
    } catch (e) {
      alert("Enhancement failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h2>AI Image Enhancer</h2>
      <input type="file" accept="image/*" onChange={handleFile} />
      <div style={{ marginTop: 16 }}>
        <button onClick={enhanceImage} disabled={loading}>
          {loading ? "Enhancing..." : "Enhance Image"}
        </button>
      </div>

      {preview && (
        <div>
          <p>Original:</p>
          <img src={preview} style={{ width: "100%", borderRadius: 8 }} />
        </div>
      )}

      {result && (
        <div>
          <p>Enhanced:</p>
          <img src={result} style={{ width: "100%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}