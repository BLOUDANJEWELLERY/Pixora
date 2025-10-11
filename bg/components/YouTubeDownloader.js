import { useState } from 'react';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateYouTubeUrl = (url) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
      /^(https?:\/\/)?(m\.)?youtube\.com\/watch\?v=[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const fetchVideoInfo = async (e) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(trimmedUrl)) {
      setError('Please enter a valid YouTube URL. Supported formats:\n- https://www.youtube.com/watch?v=VIDEO_ID\n- https://youtu.be/VIDEO_ID\n- https://m.youtube.com/watch?v=VIDEO_ID');
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
          quality: format.quality,
          title: videoInfo.title,
          videoId: videoInfo.videoId,
          itag: format.itag
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Download service unavailable');
      }

      if (data.success && data.downloadUrl) {
        // Redirect to download URL
        window.open(data.downloadUrl, '_blank');
        setSuccess(`Download started for ${format.quality} quality!`);
      } else if (data.alternatives) {
        // Show alternative methods
        setSuccess(
          `Direct download not available. Try these services:\n${data.alternatives.join('\n')}`
        );
      } else {
        throw new Error('Download failed. Please try another format.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const openExternalService = (service) => {
    if (!videoInfo) return;
    
    const videoId = videoInfo.videoId;
    let serviceUrl = '';
    
    switch(service) {
      case 'ssyoutube':
        serviceUrl = `https://ssyoutube.com/watch?v=${videoId}`;
        break;
      case 'savefrom':
        serviceUrl = `https://en.savefrom.net/download-from-youtube/?url=${encodeURIComponent(url)}`;
        break;
      case 'ytmp3':
        serviceUrl = `https://ytmp3.cc/en13/?v=${videoId}`;
        break;
      default:
        return;
    }
    
    window.open(serviceUrl, '_blank');
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          YouTube Video Downloader
        </h1>
        <p className="text-gray-600">
          Download YouTube videos using multiple methods
        </p>
      </div>

      {/* Legal Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                This tool is for personal use only. Please respect copyright laws and YouTube Terms of Service. 
                Only download videos you have permission to use.
              </p>
            </div>
          </div>
        </div>
      </div>

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

          {/* Example URLs */}
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Example URLs:</p>
            <div className="space-y-1">
              {exampleUrls.map((exampleUrl, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setUrl(exampleUrl)}
                  className="block text-blue-600 hover:text-blue-800 text-left text-xs"
                >
                  {exampleUrl}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching Video Info...
                </span>
              ) : 'Get Video Info'}
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

        {/* Success Message */}
        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-green-800 font-medium block mb-1">Success</span>
                <pre className="text-green-800 text-sm whitespace-pre-wrap">{success}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-red-800 font-medium block mb-1">Error</span>
                <pre className="text-red-800 text-sm whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Information */}
      {videoInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <img
                src={videoInfo.thumbnail}
                alt="Video thumbnail"
                className="w-64 h-36 object-cover rounded-lg shadow-md"
              />
            </div>
            
            {/* Video Details */}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Formats</h3>
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

          {/* Alternative Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alternative Download Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => openExternalService('ssyoutube')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <div className="font-medium text-gray-900">SSYouTube</div>
                <div className="text-sm text-gray-600 mt-1">External service</div>
              </button>
              
              <button
                onClick={() => openExternalService('savefrom')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <div className="font-medium text-gray-900">SaveFrom.net</div>
                <div className="text-sm text-gray-600 mt-1">External service</div>
              </button>
              
              <button
                onClick={() => openExternalService('ytmp3')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                <div className="font-medium text-gray-900">YTMP3</div>
                <div className="text-sm text-gray-600 mt-1">MP3/MP4 converter</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeDownloader;