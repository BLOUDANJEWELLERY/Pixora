import { useState } from 'react';

export default function DownloadPage() {
  const [url, setUrl] = useState('');

  const handleDownload = () => {
    if (!url) return;
    window.location.href = `/api/yt-download?url=${encodeURIComponent(url)}`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>YouTube Video Downloader</h1>
      <input
        type="text"
        placeholder="Enter YouTube link"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ width: '60%', padding: '10px' }}
      />
      <button onClick={handleDownload} style={{ padding: '10px 20px', marginLeft: '10px' }}>
        Download
      </button>
    </div>
  );
}