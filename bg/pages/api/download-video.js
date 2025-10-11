import ytdl from 'ytdl-core';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, itag, quality, title, videoId } = req.body;

  if (!url || !videoId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Convert mobile URL to standard YouTube URL
    let videoUrl = url;
    if (url.includes('m.youtube.com')) {
      videoUrl = url.replace('m.youtube.com', 'www.youtube.com');
    }

    const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Attempting download from:', standardUrl);

    // Method 1: Try ytdl-core with different options
    let info;
    let selectedFormat;
    
    try {
      console.log('Trying ytdl-core method...');
      info = await ytdl.getInfo(standardUrl, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
          }
        }
      });

      // Try to find the requested format
      selectedFormat = ytdl.chooseFormat(info.formats, { 
        quality: itag || 'highest',
        filter: format => format.hasVideo && format.hasAudio && format.container === 'mp4'
      });

      if (!selectedFormat) {
        // Fallback to any available format
        selectedFormat = ytdl.chooseFormat(info.formats, { 
          quality: 'lowest',
          filter: format => format.hasVideo && format.hasAudio
        });
      }

      if (!selectedFormat) {
        throw new Error('No suitable format found');
      }

    } catch (ytdlError) {
      console.log('ytdl-core failed, trying alternative method...', ytdlError.message);
      
      // Method 2: Use external service as fallback
      const externalUrl = await getExternalDownloadUrl(videoId, quality);
      if (externalUrl) {
        return res.status(200).json({
          success: true,
          external: true,
          downloadUrl: externalUrl,
          filename: `${title.replace(/[^a-z0-9]/gi, '_')}_${quality}.mp4`
        });
      }
      
      throw new Error('All download methods failed');
    }

    // Sanitize filename
    const sanitizedTitle = title
      .replace(/[^a-z0-9\s]/gi, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100);

    const filename = `${sanitizedTitle}_${quality}.${selectedFormat.container || 'mp4'}`;

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', selectedFormat.mimeType || 'video/mp4');
    res.setHeader('Cache-Control', 'no-cache');

    console.log(`Starting download: ${filename} (${selectedFormat.qualityLabel})`);

    // Create the stream with proper error handling
    const videoStream = ytdl(standardUrl, { 
      format: selectedFormat,
      quality: selectedFormat.itag
    });

    // Handle stream events
    videoStream.on('progress', (chunkLength, downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      console.log(`Download progress: ${percent}%`);
    });

    videoStream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error occurred during download' });
      }
    });

    // Pipe the stream to response
    videoStream.pipe(res);

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected');
      if (videoStream.destroy) {
        videoStream.destroy();
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    
    if (!res.headersSent) {
      // Final fallback - provide external service links
      res.status(200).json({
        success: false,
        message: 'Direct download not available. Try these services:',
        alternatives: [
          `https://ssyoutube.com/watch?v=${videoId}`,
          `https://en.savefrom.net/download-from-youtube/?url=${encodeURIComponent(url)}`,
          `https://ytmp3.cc/en13/?v=${videoId}`
        ]
      });
    }
  }
}

async function getExternalDownloadUrl(videoId, quality) {
  try {
    // Try y2mate API
    const response = await axios.get(`https://www.y2mate.com/mates/analyzeV2/ajax`, {
      params: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        q_auto: 0,
        ajax: 1
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    });

    if (response.data && response.data.result) {
      // Parse the response to extract download links
      // This is a simplified example - you'd need to parse the actual response
      return `https://www.y2mate.com/mates/convertV2/index?vid=${videoId}`;
    }
  } catch (error) {
    console.log('External service failed:', error.message);
  }
  
  return null;
}