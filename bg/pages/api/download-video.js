import ytdl from 'ytdl-core';
import { Writable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, quality, title } = req.body; // Added 'quality'

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'A valid YouTube URL is required' });
  }

  try {
    const videoInfo = await ytdl.getInfo(url);

    const sanitizedTitle = (title || videoInfo.videoDetails.title)
      .replace(/[^a-zA-Z0-9\s]/g, '_')
      .replace(/\s+/g, '_');
      
    // If a specific quality is requested, find the corresponding format
    const format = ytdl.filterFormats(videoInfo.formats, (f) => {
      return f.qualityLabel === quality && f.hasVideo && f.hasAudio;
    }).sort((a,b) => b.contentLength - a.contentLength)[0]; // Get the best matching format for that quality

    if (!format) {
      return res.status(404).json({ error: `No suitable format found for quality: ${quality}` });
    }

    const filename = `${sanitizedTitle}_${quality}.mp4`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const downloadStream = ytdl(url, {
      format: format, // Use the specific format found
    });

    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download the video stream.' });
      }
    });

  } catch (error) {
    console.error('Error during video download:', error);
    if (!res.headersSent) {
        res.status(500).json({
          error: 'An error occurred while trying to download the video.',
          details: error.message,
        });
    }
  }
}
