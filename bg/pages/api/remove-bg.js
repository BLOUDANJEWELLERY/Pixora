export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { imageBase64, bgColor } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ message: "No image provided" });
  }

  try {
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_file_b64: imageBase64,
        size: "auto",
        bg_color: bgColor || null, // if not given → transparent
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error processing image" });
  }
}