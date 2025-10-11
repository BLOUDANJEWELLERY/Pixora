import { useState } from 'react';

export default function DownloadPage() {
  const [url, setUrl] = useState('');

  const handleDownload = () => {
    if (!url) return alert('Enter a YouTube URL');
    
    const PUPPETEER_SERVER = 'https://gold-rate-vt9u.onrender.com'; // Your Render server URL

    // Open the Puppeteer server download endpoint in a new tab
    window.open(`${PUPPETEER_SERVER}/download?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div style={{
      textAlign: 'center',
      marginTop: '50px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>YouTube Video Downloader</h1>
      <input
        type="text"
        placeholder="Enter YouTube link"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{
          width: '60%',
          padding: '10px',
          fontSize: '16px',
          borderRadius: '5px',
          border: '1px solid #ccc'
        }}
      />
      <button
        onClick={handleDownload}
        style={{
          padding: '10px 20px',
          marginLeft: '10px',
          fontSize: '16px',
          borderRadius: '5px',
          backgroundColor: '#f7b731',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Download
      </button>
    </div>
  );
}