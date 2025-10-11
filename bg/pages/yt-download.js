import { useState } from 'react';

export default function DownloadPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!url) return alert('Enter a YouTube URL');

    const PUPPETEER_SERVER = 'https://gold-rate-lm4o.onrender.com';

    try {
      setLoading(true);
      const res = await fetch(`${PUPPETEER_SERVER}/download?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (data.downloadUrl) {
        // Open direct video URL for download
        window.open(data.downloadUrl, '_blank');
      } else {
        alert('Failed to get video URL');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>YouTube Video Downloader</h1>
      <input
        type="text"
        placeholder="Enter YouTube link"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ width: '60%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
      />
      <button
        onClick={handleDownload}
        style={{ padding: '10px 20px', marginLeft: '10px', fontSize: '16px', borderRadius: '5px', backgroundColor: '#f7b731', border: 'none', cursor: 'pointer' }}
        disabled={loading}
      >
        {loading ? 'Fetching...' : 'Download'}
      </button>
    </div>
  );
}