import ytdl from 'ytdl-core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, itag, quality, title, videoId } = req.body;

  if (!url || !itag || !videoId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Convert mobile URL to standard YouTube URL
    let videoUrl = url;
    if (url.includes('m.youtube.com')) {
      videoUrl = url.replace('m.youtube.com', 'www.youtube.com');
    }

    // Extract video ID if not provided
    const actualVideoId = videoId || extractVideoId(url);
    const standardUrl = `https://www.youtube.com/watch?v=${actualVideoId}`;

    console.log('Downloading from URL:', standardUrl);

    // Validate YouTube URL
    if (!ytdl.validateURL(standardUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info
    let info;
    try {
      info = await ytdl.getInfo(standardUrl);
    } catch (error) {
      console.error('Error getting video info:', error);
      return res.status(400).json({ 
        error: 'Failed to get video information. The video might be restricted or unavailable.' 
      });
    }

    // Find the requested format
    const format = ytdl.chooseFormat(info.formats, { 
      quality: itag,
      filter: format => format.hasVideo && format.hasAudio
    });

    if (!format) {
      // Fallback to any available format
      const fallbackFormat = ytdl.chooseFormat(info.formats, { 
        quality: 'lowest',
        filter: format => format.hasVideo && format.hasAudio
      });
      
      if (!fallbackFormat) {
        return res.status(400).json({ error: 'No downloadable formats available for this video' });
      }
    }

    const selectedFormat = format || fallbackFormat;

    // Sanitize filename
    const sanitizedTitle = title
      .replace(/[^a-z0-9\s]/gi, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100);

    const filename = `${sanitizedTitle}_${quality}.${selectedFormat.container || 'mp4'}`;

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', selectedFormat.mimeType || 'video/mp4');
    res.setHeader('Content-Length', selectedFormat.contentLength || '');
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`Starting download: ${filename} (${selectedFormat.qualityLabel})`);

    // Create the stream with proper error handling
    const videoStream = ytdl(standardUrl, { 
      format: selectedFormat,
      quality: itag
    });

    // Handle stream events
    videoStream.on('info', (info, format) => {
      console.log('Download started successfully');
    });

    videoStream.on('progress', (chunkLength, downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      console.log(`Download progress: ${percent}%`);
    });

    videoStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred during download' });
      } else {
        // If headers were sent, we can't send JSON, so end the response
        res.end();
      }
    });

    videoStream.on('end', () => {
      console.log('Download completed successfully');
    });

    // Pipe the stream to response
    videoStream.pipe(res);

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected, destroying stream');
      if (videoStream.destroy) {
        videoStream.destroy();
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    
    if (!res.headersSent) {
      let errorMessage = 'Failed to download video. ';
      
      if (error.message.includes('Video unavailable')) {
        errorMessage += 'Video is unavailable or private.';
      } else if (error.message.includes('Sign in to confirm your age')) {
        errorMessage += 'Age-restricted videos cannot be downloaded.';
      } else {
        errorMessage += 'Please try again with a different quality.';
      }

      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /(?:m\.youtube\.com\/watch\?v=)([^&?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}