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

    // Use YouTube oEmbed API for basic info
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const oEmbedResponse = await axios.get(oEmbedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const videoInfo = {
      title: oEmbedResponse.data.title,
      author: oEmbedResponse.data.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoId: videoId,
      formats: getAvailableFormats()
    };

    res.status(200).json(videoInfo);

  } catch (error) {
    console.error('Error fetching video info:', error);
    
    let errorMessage = 'Failed to fetch video information. ';
    
    if (error.response?.status === 404) {
      errorMessage += 'Video not found. Please check the URL.';
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