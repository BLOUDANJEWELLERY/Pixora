import ytdl from 'ytdl-core';
import { PassThrough } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, itag, quality, title } = req.body;

  if (!url || !itag) {
    return res.status(400).json({ error: 'URL and format are required' });
  }

  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info to verify
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });

    if (!format) {
      return res.status(400).json({ error: 'Requested format not available' });
    }

    // Sanitize filename
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedTitle}_${quality}.mp4`;

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Create stream and pipe to response
    const videoStream = ytdl(url, { format: format });
    
    videoStream.pipe(res);

    // Handle stream errors
    videoStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred' });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to download video. Please try again.' 
      });
    }
  }
}