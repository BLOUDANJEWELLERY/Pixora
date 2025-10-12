import ytdl from 'ytdl-core';
import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoId, quality, title } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    console.log('Starting download for video:', videoId, 'Quality:', quality);

    // Validate YouTube URL
    if (!ytdl.validateID(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID' });
    }

    // Get video info first
    const videoInfo = await ytdl.getInfo(videoId);
    const videoDetails = videoInfo.videoDetails;

    // Map quality to itag
    const itag = getItagForQuality(quality);
    
    // Choose format based on itag
    let format;
    if (itag) {
      format = ytdl.chooseFormat(videoInfo.formats, {
        quality: itag,
        filter: format => format.hasVideo && format.hasAudio
      });
    }

    // If specific format not found, get the best available with audio
    if (!format) {
      format = ytdl.chooseFormat(videoInfo.formats, {
        quality: 'highest',
        filter: format => format.hasVideo && format.hasAudio
      });
    }

    if (!format) {
      return res.status(404).json({ error: 'No suitable format found' });
    }

    console.log('Selected format:', format.qualityLabel, format.itag);

    // Sanitize filename
    const sanitizedTitle = title 
      ? title.replace(/[^a-z0-9\s]/gi, '_').replace(/\s+/g, '_').substring(0, 100)
      : `youtube_video_${videoId}`;

    const filename = `${sanitizedTitle}_${format.qualityLabel || quality}.mp4`;

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    // Get the video stream
    const videoStream = ytdl(videoId, { 
      format: format,
      quality: itag || 'highest'
    });

    // Handle stream events
    videoStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred' });
      } else {
        res.end();
      }
    });

    // Pipe the video stream to response
    videoStream.pipe(res);

    // Handle client disconnect
    req.on('close', () => {
      videoStream.destroy();
    });

  } catch (error) {
    console.error('Download error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed. Please try again.',
        details: error.message
      });
    }
  }
}

function getItagForQuality(quality) {
  const qualityMap = {
    '1080p': '137',
    '720p': '22', 
    '480p': '135',
    '360p': '18',
    '240p': '133'
  };
  
  return qualityMap[quality] || null;
}