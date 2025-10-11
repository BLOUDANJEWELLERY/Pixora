import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, quality, title, videoId, itag } = req.body;

  if (!url || !videoId) {
    return res.status(400).json({ error: 'URL and video ID are required' });
  }

  try {
    // Method 1: Try using y2mate API (free service)
    const downloadUrl = await getDownloadUrlFromService(videoId, itag);
    
    if (downloadUrl) {
      // Redirect to download URL
      return res.status(200).json({ 
        success: true, 
        downloadUrl: downloadUrl,
        filename: `${title.replace(/[^a-z0-9]/gi, '_')}_${quality}.mp4`
      });
    }

    // Method 2: Alternative approach - use savefrom.net
    const saveFromUrl = await getSaveFromUrl(url);
    if (saveFromUrl) {
      return res.status(200).json({ 
        success: true, 
        downloadUrl: saveFromUrl,
        filename: `${title.replace(/[^a-z0-9]/gi, '_')}_${quality}.mp4`
      });
    }

    throw new Error('No download service available');

  } catch (error) {
    console.error('Download error:', error);
    
    // Fallback: Provide instructions for manual download
    res.status(200).json({
      success: false,
      message: 'Direct download not available. Try these alternatives:',
      alternatives: [
        `Use: https://ssyoutube.com/watch?v=${videoId}`,
        `Use: https://en.savefrom.net/download-from-youtube/?url=${encodeURIComponent(url)}`,
        `Use: https://ytmp3.cc/en13/?v=${videoId}`
      ]
    });
  }
}

async function getDownloadUrlFromService(videoId, itag) {
  try {
    // Using a proxy service to get download links
    const response = await axios.get(`https://api.vevio.com/api/convert`, {
      params: {
        v: videoId,
        apikey: 'your-api-key-here' // You'd need to get an API key
      },
      timeout: 10000
    });
    
    return response.data?.url || null;
  } catch (error) {
    console.log('Service 1 failed:', error.message);
    return null;
  }
}

async function getSaveFromUrl(youtubeUrl) {
  try {
    const response = await axios.post('https://ssyoutube.com/api/convert', {
      url: youtubeUrl
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return response.data?.url || null;
  } catch (error) {
    console.log('SaveFrom service failed:', error.message);
    return null;
  }
}