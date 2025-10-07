import { useEffect, useState } from "react";
import { removeBackground } from "@imgly/background-removal";

export function usePreloadBackgroundRemoval() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Preload by calling removeBackground with a dummy tiny transparent PNG blob
    (async () => {
      try {
        const tinyBlob = await fetch(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgMBgBZwDJUAAAAASUVORK5CYII="
        )
          .then((r) => r.blob());
        await removeBackground(tinyBlob); // warms up model
        setReady(true);
        console.log("✅ Background removal model preloaded");
      } catch (err) {
        console.warn("⚠️ Model preload failed:", err);
      }
    })();
  }, []);

  return ready;
}