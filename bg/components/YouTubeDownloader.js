import { useState } from 'react';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVideoInfo = async (e) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setVideoInfo(null);

    try {
      const response = await fetch('/api/video-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video information');
      }

      setVideoInfo(data);
      setSuccess('Video information loaded successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (format) => {
    if (!videoInfo || downloading) return;

    setDownloading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/download-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          itag: format.itag,
          quality: format.quality,
          title: videoInfo.title,
          videoId: videoInfo.videoId
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.external) {
        throw new Error(data.error || 'Download failed');
      }

      if (data.success && data.external) {
        // Open external service in new tab
        window.open(data.downloadUrl, '_blank');
        setSuccess(`Redirecting to external download service for ${format.quality} quality...`);
      } else if (data.success) {
        // Handle direct download
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.filename || `${videoInfo.title.replace(/[^a-z0-9]/gi, '_')}_${format.quality}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        setSuccess(`Download completed successfully!`);
      } else if (data.alternatives) {
        // Show alternative methods
        setSuccess(
          `Direct download not available. Try these services:\n${data.alternatives.join('\n')}`
        );
      } else {
        throw new Error('Download failed. Please try another format.');
      }

    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Download failed. Please try a different quality option.');
    } finally {
      setDownloading(false);
    }
  };

  // Simple direct download using iframe (last resort)
  const trySimpleDownload = (format) => {
    if (!videoInfo) return;
    
    const videoId = videoInfo.videoId;
    const services = [
      `https://ssyoutube.com/watch?v=${videoId}`,
      `https://en.savefrom.net/download-from-youtube/?url=${encodeURIComponent(url)}`,
      `https://ytmp3.cc/en13/?v=${videoId}`
    ];
    
    // Open the first service in new tab
    window.open(services[0], '_blank');
    setSuccess('Opening external download service...');
  };

  const resetForm = () => {
    setUrl('');
    setVideoInfo(null);
    setError('');
    setSuccess('');
  };

  const exampleUrls = [
    'https://www.youtube.com/watch?v=J9Fb6QMRZaA',
    'https://youtu.be/J9Fb6QMRZaA',
    'https://m.youtube.com/watch?v=J9Fb6QMRZaA'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header and legal notice same as before */}
      
      {/* URL Input Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <form onSubmit={fetchVideoInfo} className="space-y-4">
          <div>
            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video URL
            </label>
            <input
              type="text"
              id="youtube-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=J9Fb6QMRZaA)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Fetching Video Info...' : 'Get Video Info'}
            </button>
            
            {videoInfo && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Success and Error Messages */}
        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <pre className="text-green-800 text-sm whitespace-pre-wrap">{success}</pre>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <pre className="text-red-800 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Video Information */}
      {videoInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <img
                src={videoInfo.thumbnail}
                alt="Video thumbnail"
                className="w-64 h-36 object-cover rounded-lg shadow-md"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {videoInfo.title}
              </h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Channel:</span> {videoInfo.author}</p>
                <p><span className="font-medium">Video ID:</span> {videoInfo.videoId}</p>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Options</h3>
            
            {/* Method 1: Direct Download */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">Direct Download (Try First):</h4>
              <div className="grid gap-3">
                {videoInfo.formats.map((format, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{format.label}</span>
                        <span className="text-gray-500 text-sm ml-2">({format.container})</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => downloadVideo(format)}
                      disabled={downloading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {downloading ? 'Processing...' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Method 2: Quick External Download */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Quick External Download:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => trySimpleDownload('1080p')}
                  className="p-4 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center"
                >
                  <div className="font-medium text-orange-900">SSYouTube</div>
                  <div className="text-sm text-orange-700 mt-1">Fast & Reliable</div>
                </button>
                
                <button
                  onClick={() => trySimpleDownload('720p')}
                  className="p-4 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center"
                >
                  <div className="font-medium text-purple-900">SaveFrom.net</div>
                  <div className="text-sm text-purple-700 mt-1">Multiple Formats</div>
                </button>
                
                <button
                  onClick={() => trySimpleDownload('audio')}
                  className="p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center"
                >
                  <div className="font-medium text-green-900">YTMP3</div>
                  <div className="text-sm text-green-700 mt-1">MP3/MP4 Converter</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeDownloader;

