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
    // Convert mobile URL to standard YouTube URL
    let videoUrl = url;
    
    // Handle mobile YouTube URLs
    if (url.includes('m.youtube.com')) {
      videoUrl = url.replace('m.youtube.com', 'www.youtube.com');
    }
    
    // Handle youtu.be short URLs
    if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop()?.split('?')[0];
      if (videoId) {
        videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    }

    // Remove unnecessary parameters that might cause issues
    try {
      const urlObj = new URL(videoUrl);
      // Keep only essential parameters
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }
    } catch (e) {
      // If URL parsing fails, continue with original URL
      console.log('URL parsing failed, using original URL');
    }

    console.log('Processing URL:', videoUrl);

    // Validate YouTube URL
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ 
        error: 'Invalid YouTube URL. Please make sure it\'s a valid YouTube video URL.' 
      });
    }

    // Get video info with timeout
    const getInfoWithTimeout = () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout - YouTube took too long to respond'));
        }, 15000); // 15 second timeout

        ytdl.getInfo(videoUrl)
          .then(info => {
            clearTimeout(timeout);
            resolve(info);
          })
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
      });
    };

    const info = await getInfoWithTimeout();
    
    // Check if video is available
    if (!info.videoDetails) {
      return res.status(400).json({ 
        error: 'Video not available. It might be private, deleted, or age-restricted.' 
      });
    }

    const videoDetails = {
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || '',
      duration: info.videoDetails.lengthSeconds,
      author: info.videoDetails.author?.name || 'Unknown',
      formats: []
    };

    // Extract available formats
    const formatMap = new Map();
    
    info.formats.forEach(format => {
      if (format.hasVideo && format.hasAudio && format.container === 'mp4') {
        const quality = format.qualityLabel || 'Unknown';
        if (!formatMap.has(quality) || format.bitrate > (formatMap.get(quality)?.bitrate || 0)) {
          formatMap.set(quality, {
            quality: quality,
            container: format.container,
            qualityLabel: format.qualityLabel,
            itag: format.itag,
            url: format.url,
            bitrate: format.bitrate
          });
        }
      }
    });

    // If no combined formats found, look for video-only and audio-only
    if (formatMap.size === 0) {
      info.formats.forEach(format => {
        if ((format.hasVideo || format.hasAudio) && format.container === 'mp4') {
          const quality = format.qualityLabel || (format.hasAudio ? 'Audio' : 'Unknown');
          if (!formatMap.has(quality) || format.bitrate > (formatMap.get(quality)?.bitrate || 0)) {
            formatMap.set(quality, {
              quality: quality,
              container: format.container,
              qualityLabel: format.qualityLabel,
              itag: format.itag,
              url: format.url,
              bitrate: format.bitrate,
              hasVideo: format.hasVideo,
              hasAudio: format.hasAudio
            });
          }
        }
      });
    }

    videoDetails.formats = Array.from(formatMap.values())
      .sort((a, b) => {
        const qualityA = parseInt(a.quality) || 0;
        const qualityB = parseInt(b.quality) || 0;
        return qualityB - qualityA;
      });

    // If still no formats, return error
    if (videoDetails.formats.length === 0) {
      return res.status(400).json({ 
        error: 'No downloadable formats found. This video might be restricted or unavailable for download.' 
      });
    }

    res.status(200).json(videoDetails);
  } catch (error) {
    console.error('Error fetching video info:', error);
    
    let errorMessage = 'Failed to fetch video information. ';
    
    if (error.message.includes('Request timeout')) {
      errorMessage += 'The request timed out. Please try again.';
    } else if (error.message.includes('Video unavailable')) {
      errorMessage += 'The video is unavailable. It might be private or deleted.';
    } else if (error.message.includes('Sign in to confirm your age')) {
      errorMessage += 'This video is age-restricted and cannot be downloaded.';
    } else {
      errorMessage += 'Please check the URL and try again.';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}