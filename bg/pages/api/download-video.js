import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, quality, title, videoId } = req.body;

  if (!url || !videoId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('Starting download for video:', videoId, 'Quality:', quality);

    // Method 1: Try to get download link from y2mate API
    const downloadUrl = await getY2MateDownloadUrl(videoId, quality);
    
    if (downloadUrl) {
      console.log('Successfully got download URL from y2mate');
      
      // Instead of redirecting, we'll proxy the download through our server
      const videoResponse = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
          'Range': 'bytes=0-'
        }
      });

      // Sanitize filename
      const sanitizedTitle = title
        .replace(/[^a-z0-9\s]/gi, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);

      const filename = `${sanitizedTitle}_${quality}.mp4`;

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', videoResponse.headers['content-length'] || '');
      res.setHeader('Cache-Control', 'no-cache');

      // Pipe the video stream to response
      videoResponse.data.pipe(res);

      videoResponse.data.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error occurred' });
        }
      });

      return;
    }

    // Method 2: Fallback - use savefrom.net API
    const saveFromUrl = await getSaveFromUrl(videoId);
    if (saveFromUrl) {
      return res.status(200).json({
        success: true,
        external: true,
        downloadUrl: saveFromUrl,
        filename: `${title.replace(/[^a-z0-9]/gi, '_')}_${quality}.mp4`
      });
    }

    throw new Error('All download methods failed');

  } catch (error) {
    console.error('Download error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed. Please try a different quality or use the external services.',
        details: error.message
      });
    }
  }
}

async function getY2MateDownloadUrl(videoId, quality) {
  try {
    // First, get the analysis page
    const analyzeUrl = `https://www.y2mate.com/mates/analyzeV2/ajax`;
    
    const formData = new URLSearchParams();
    formData.append('url', `https://www.youtube.com/watch?v=${videoId}`);
    formData.append('q_auto', '0');
    formData.append('ajax', '1');

    const analyzeResponse = await axios.post(analyzeUrl, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.y2mate.com',
        'Referer': 'https://www.y2mate.com/'
      },
      timeout: 15000
    });

    if (analyzeResponse.data && analyzeResponse.data.result) {
      // Parse the result to extract download links
      const result = analyzeResponse.data.result;
      
      // Look for MP4 formats
      const mp4Formats = result.links?.mp4 || {};
      
      // Get the best available quality
      const qualities = Object.keys(mp4Formats);
      if (qualities.length > 0) {
        const bestQuality = qualities[0]; // Usually the first is the best
        const format = mp4Formats[bestQuality];
        
        if (format && format.k) {
          // Now get the actual download URL
          const convertUrl = `https://www.y2mate.com/mates/convertV2/index`;
          
          const convertFormData = new URLSearchParams();
          convertFormData.append('vid', videoId);
          convertFormData.append('k', format.k);

          const convertResponse = await axios.post(convertUrl, convertFormData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'X-Requested-With': 'XMLHttpRequest',
              'Origin': 'https://www.y2mate.com',
              'Referer': 'https://www.y2mate.com/'
            },
            timeout: 15000
          });

          if (convertResponse.data && convertResponse.data.dlink) {
            return convertResponse.data.dlink;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log('Y2Mate method failed:', error.message);
    return null;
  }
}

async function getSaveFromUrl(videoId) {
  try {
    const response = await axios.get(`https://api.savefrom.net/api/convert`, {
      params: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        format: 'mp4'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    if (response.data && response.data.url) {
      return response.data.url;
    }
    
    return null;
  } catch (error) {
    console.log('SaveFrom method failed:', error.message);
    return null;
  }
}