import axios from 'axios';
import ytdl from 'ytdl-core';

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

    // Convert to standard URL for ytdl-core
    const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Use YouTube oEmbed API to get basic video info
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${standardUrl}&format=json`;
    
    let oEmbedResponse;
    try {
      oEmbedResponse = await axios.get(oEmbedUrl);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Video not found or unavailable. It might be private, deleted, or age-restricted.' 
      });
    }

    // Get available formats using ytdl-core
    let formats = [];
    try {
      const info = await ytdl.getInfo(standardUrl);
      formats = getAvailableFormats(info.formats);
    } catch (error) {
      console.log('Could not get formats with ytdl-core, using default formats');
      formats = getDefaultFormats();
    }

    const videoInfo = {
      title: oEmbedResponse.data.title,
      author: oEmbedResponse.data.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoId: videoId,
      formats: formats
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

function getAvailableFormats(formats) {
  const availableFormats = [];
  const qualityMap = new Map();

  // Look for formats with both video and audio
  formats.forEach(format => {
    if (format.hasVideo && format.hasAudio && format.container === 'mp4') {
      const quality = format.qualityLabel || 'Unknown';
      if (!qualityMap.has(quality) || format.bitrate > (qualityMap.get(quality)?.bitrate || 0)) {
        qualityMap.set(quality, {
          quality: quality,
          label: `${quality} (Recommended)`,
          itag: format.itag,
          type: 'mp4',
          container: format.container,
          bitrate: format.bitrate
        });
      }
    }
  });

  // If no combined formats, look for separate video and audio
  if (qualityMap.size === 0) {
    formats.forEach(format => {
      if (format.hasVideo && format.container === 'mp4') {
        const quality = format.qualityLabel || 'Video';
        if (!qualityMap.has(quality)) {
          qualityMap.set(quality, {
            quality: quality,
            label: `${quality} (Video only)`,
            itag: format.itag,
            type: 'mp4',
            container: format.container,
            hasVideo: true,
            hasAudio: false
          });
        }
      }
    });
  }

  // Convert to array and sort by quality
  return Array.from(qualityMap.values())
    .sort((a, b) => {
      const qualityA = parseInt(a.quality) || 0;
      const qualityB = parseInt(b.quality) || 0;
      return qualityB - qualityA;
    });
}

function getDefaultFormats() {
  // Fallback formats if ytdl-core fails
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
    }
  ];
}