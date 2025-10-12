import ytdl from 'ytdl-core';
import axios from 'axios';

export default async function handler(req, res) {
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

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Could not extract video ID from URL.' 
      });
    }

    console.log('Processing video ID:', videoId);

    // Validate YouTube URL
    if (!ytdl.validateID(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID' });
    }

    // Get video info using ytdl-core
    const videoInfo = await ytdl.getInfo(videoId);
    const videoDetails = videoInfo.videoDetails;

    const videoData = {
      title: videoDetails.title,
      author: videoDetails.author.name,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      videoId: videoId,
      duration: videoDetails.lengthSeconds,
      viewCount: videoDetails.viewCount,
      formats: getAvailableFormats()
    };

    res.status(200).json(videoData);

  } catch (error) {
    console.error('Error fetching video info:', error);
    
    let errorMessage = 'Failed to fetch video information. ';
    
    if (error.message.includes('Video unavailable')) {
      errorMessage += 'Video not found or unavailable.';
    } else {
      errorMessage += 'Please try again with a different URL.';
    }

    res.status(500).json({ 
      error: errorMessage
    });
  }
}

// Keep your existing extractVideoId and getAvailableFormats functions
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /(?:m\.youtube\.com\/watch\?v=)([^&?#]+)/,
    /youtube\.com\/watch\?.*v=([^&?#]+)/,
    /youtu\.be\/([^&?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

function getAvailableFormats() {
  return [
    {
      quality: '1080p',
      label: 'Full HD (1080p)',
      itag: '137',
      type: 'mp4'
    },
    {
      quality: '720p', 
      label: 'HD (720p)',
      itag: '22',
      type: 'mp4'
    },
    {
      quality: '480p',
      label: 'Standard (480p)',
      itag: '135',
      type: 'mp4'
    },
    {
      quality: '360p',
      label: 'Medium (360p)',
      itag: '18',
      type: 'mp4'
    },
    {
      quality: '240p',
      label: 'Low (240p)',
      itag: '133',
      type: 'mp4'
    }
  ];
}