import ytdl from 'ytdl-core';
import { Writable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, title } = req.body;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'A valid YouTube URL is required' });
  }

  try {
    const videoInfo = await ytdl.getInfo(url);
    // Sanitize the title for the filename
    const sanitizedTitle = (title || videoInfo.videoDetails.title)
      .replace(/[^a-zA-Z0-9\s]/g, '_') // Replace non-alphanumeric characters with underscores
      .replace(/\s+/g, '_'); // Replace spaces with underscores

    const filename = `${sanitizedTitle}.mp4`;

    // Set the response headers to trigger a download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Stream the video directly to the response
    const downloadStream = ytdl(url, {
      quality: 'highest',
      filter: 'videoandaudio',
    });

    // Pipe the download stream to the response
    downloadStream.pipe(res);

    // Handle potential errors during the stream
    downloadStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download the video.' });
      }
    });

  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({
      error: 'An error occurred while trying to download the video.',
      details: error.message,
    });
  }
}
