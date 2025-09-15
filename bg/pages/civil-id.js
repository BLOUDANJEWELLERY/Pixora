"use client";
import { useState, useEffect } from "react";

export default function CvLoader() {
  const [cvReady, setCvReady] = useState(false);
  const [cvError, setCvError] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://docs.opencv.org/4.7.0/opencv.js"; // CDN
    script.async = true;

    script.onload = () => {
      if (window.cv) {
        window.cv['onRuntimeInitialized'] = () => setCvReady(true);
      } else setCvError("OpenCV failed to initialize");
    };
    script.onerror = () => setCvError("Failed to load OpenCV script");

    document.body.appendChild(script);

    const timeout = setTimeout(() => {
      if (!cvReady) setCvError("OpenCV loading timeout. Refresh page.");
    }, 20000);

    return () => {
      document.body.removeChild(script);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div>
      {!cvReady && !cvError && <p>Loading OpenCV… (can take 10-20s)</p>}
      {cvError && <p className="text-red-600">{cvError}</p>}
      {cvReady && <p>OpenCV ready ✅</p>}
    </div>
  );
}