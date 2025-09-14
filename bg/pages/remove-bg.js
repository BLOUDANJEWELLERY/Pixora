import { useState } from "react";

export default function RemoveBgPage() {
  const [preview, setPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.image.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/remove-bg", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const blob = await res.blob();
      setPreview(URL.createObjectURL(blob));
    } else {
      const error = await res.json();
      alert("Error: " + error.error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Remove Background</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" name="image" accept="image/*" />
        <button type="submit">Upload</button>
      </form>

      {preview && (
        <div>
          <h3>Result:</h3>
          <img src={preview} alt="Processed" style={{ maxWidth: "400px" }} />
          <a href={preview} download="output.png">Download</a>
        </div>
      )}
    </div>
  );
}