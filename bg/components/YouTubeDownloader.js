import { useState } from 'react';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (format) => {
    if (!videoInfo || downloading) return;

    setDownloading(true);
    
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
          title: videoInfo.title
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Create blob from response and trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoInfo.title.replace(/[^a-z0-9]/gi, '_')}_${format.quality}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setVideoInfo(null);
    setError('');
  };

  // Add example URLs for user reference
  const exampleUrls = [
    'https://www.youtube.com/watch?v=J9Fb6QMRZaA',
    'https://youtu.be/J9Fb6QMRZaA',
    'https://m.youtube.com/watch?v=J9Fb6QMRZaA'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ... (keep the existing header and legal notice) ... */}

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

      {/* ... (rest of the component remains the same) ... */}
    </div>
  );
};

export default YouTubeDownloader;