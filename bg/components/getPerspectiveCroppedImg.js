export default function getPerspectiveCroppedImg(imageSrc, points) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const [tl, tr, br, bl] = points;
      const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
      const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
      const maxWidth = Math.max(widthTop, widthBottom);

      const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
      const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);
      const maxHeight = Math.max(heightLeft, heightRight);

      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      const ctx = canvas.getContext("2d");

      // Use a library like 'opentype.js' or 'opencv.js' for a real perspective warp.
      // For simplicity, just draw bounding box for now:
      ctx.drawImage(img,
        Math.min(tl.x, bl.x),
        Math.min(tl.y, tr.y),
        maxWidth,
        maxHeight,
        0, 0,
        maxWidth,
        maxHeight
      );

      resolve(canvas.toDataURL("image/jpeg"));
    };
  });
}