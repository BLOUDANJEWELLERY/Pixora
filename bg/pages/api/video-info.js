import axios from 'axios';

export default async function handler(req, res) {
  // Enable CORS
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
    // Extract video ID from various YouTube URL formats
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Could not extract video ID from URL. Please use a standard YouTube URL.' 
      });
    }

    console.log('Extracted video ID:', videoId);

    // Use YouTube oEmbed API to get basic video info
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const [oEmbedResponse, thumbnails] = await Promise.all([
      axios.get(oEmbedUrl).catch(() => null),
      getVideoThumbnails(videoId)
    ]);

    if (!oEmbedResponse) {
      return res.status(400).json({ 
        error: 'Video not found or unavailable. It might be private, deleted, or age-restricted.' 
      });
    }

    const videoInfo = {
      title: oEmbedResponse.data.title,
      author: oEmbedResponse.data.author_name,
      thumbnail: thumbnails.high || thumbnails.medium || oEmbedResponse.data.thumbnail_url,
      videoId: videoId,
      formats: generateDownloadOptions(videoId)
    };

    res.status(200).json(videoInfo);

  } catch (error) {
    console.error('Error fetching video info:', error);
    
    let errorMessage = 'Failed to fetch video information. ';
    
    if (error.response?.status === 404) {
      errorMessage += 'Video not found. Please check the URL.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage += 'Network error. Please check your connection.';
    } else {
      errorMessage += 'Please try again with a different URL.';
    }

    res.status(500).json({ 
      error: errorMessage
    });
  }
}

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

async function getVideoThumbnails(videoId) {
  const qualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];
  const thumbnails = {};

  // Return thumbnail URLs for different qualities
  return {
    high: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    low: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  };
}

function generateDownloadOptions(videoId) {
  // These are common quality options for YouTube videos
  return [
    {
      quality: '1080p',
      label: 'Full HD (1080p)',
      itag: '137',
      type: 'mp4',
      container: 'mp4'
    },
    {
      quality: '720p',
      label: 'HD (720p)',
      itag: '22',
      type: 'mp4',
      container: 'mp4'
    },
    {
      quality: '480p',
      label: 'Standard (480p)',
      itag: '135',
      type: 'mp4',
      container: 'mp4'
    },
    {
      quality: '360p',
      label: 'Medium (360p)',
      itag: '18',
      type: 'mp4',
      container: 'mp4'
    },
    {
      quality: '240p',
      label: 'Low (240p)',
      itag: '133',
      type: 'mp4',
      container: 'mp4'
    }
  ];
}