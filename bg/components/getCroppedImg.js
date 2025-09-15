export default function getCroppedImg(imageSrc, crop, rotation = 0) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");

      ctx.translate(crop.width/2, crop.height/2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-crop.width/2, -crop.height/2);

      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      resolve(canvas.toDataURL("image/jpeg"));
    };
  });
}