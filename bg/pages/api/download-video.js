import ytdl from 'ytdl-core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, itag, quality, title } = req.body;

  if (!url || !itag) {
    return res.status(400).json({ error: 'URL and format are required' });
  }

  try {
    // Convert mobile URL to standard YouTube URL
    let videoUrl = url;
    if (url.includes('m.youtube.com')) {
      videoUrl = url.replace('m.youtube.com', 'www.youtube.com');
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info to verify format availability
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });

    if (!format) {
      return res.status(400).json({ error: 'Requested format not available' });
    }

    // Sanitize filename
    const sanitizedTitle = title
      .replace(/[^a-z0-9\s]/gi, '_')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 100); // Limit length

    const filename = `${sanitizedTitle}_${quality}.${format.container || 'mp4'}`;

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format.mimeType || 'video/mp4');
    res.setHeader('Cache-Control', 'no-cache');

    // Create stream with error handling
    const videoStream = ytdl(videoUrl, { 
      format: format,
      quality: itag
    });

    // Handle stream events
    videoStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred during download' });
      } else {
        res.end();
      }
    });

    videoStream.on('info', (info, format) => {
      console.log('Download started for:', info.videoDetails.title);
    });

    // Pipe stream to response
    videoStream.pipe(res);

    // Handle client disconnect
    req.on('close', () => {
      if (videoStream.destroy) {
        videoStream.destroy();
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