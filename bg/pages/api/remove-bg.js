import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // using formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Form parsing failed" });
    }

    try {
      const file = files.image;
      if (!file) return res.status(400).json({ error: "No file uploaded" });

      // Handle both array and object cases
      const filepath = Array.isArray(file) ? file[0].filepath : file.filepath;
      if (!filepath) return res.status(400).json({ error: "Filepath missing" });

      // Read file as buffer
      const imageBuffer = fs.readFileSync(filepath);

      // Send to remove.bg
      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_file", new Blob([imageBuffer]), "upload.png");

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_API_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}