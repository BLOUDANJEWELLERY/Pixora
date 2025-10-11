// pages/api/yt-download.js
import ytdl from 'ytdl-core';

function normalizeYoutubeUrl(input) {
  if (!input) return input;
  // decode if encoded
  let url = decodeURIComponent(input.trim());
  // convert youtu.be short links -> full
  url = url.replace(/^https?:\/\/youtu\.be\//i, 'https://www.youtube.com/watch?v=');
  // convert mobile host to www
  url = url.replace(/^https?:\/\/m\.youtube\.com/i, 'https://www.youtube.com');
  // ensure watch?v= present (best-effort)
  return url;
}

export default async function handler(req, res) {
  const raw = req.query.url || req.body?.url;
  if (!raw) return res.status(400).send('Missing url parameter');

  const url = normalizeYoutubeUrl(raw);

  if (!ytdl.validateURL(url)) {
    return res.status(400).send('Invalid YouTube URL after normalization: ' + url);
  }

  try {
    const info = await ytdl.getInfo(url);

    // Choose combined audio+video format if available, otherwise highest audio+video
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' })
                   || ytdl.chooseFormat(info.formats, { quality: 'highestvideo' })
                   || info.formats[0];

    const titleSafe = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, '-').slice(0, 100);
    const filename = `${titleSafe}.mp4`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const stream = ytdl.downloadFromInfo(info, { format });

    // if platform supports piping directly, pipe
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('ytdl stream error:', err);
      // only send error if headers not sent
      if (!res.headersSent) res.status(500).send('Stream error');
      try { res.end(); } catch(e) {}
    });

    req.on('close', () => {
      // client disconnected
      stream.destroy();
    });
  } catch (err) {
    console.error('download handler error:', err);
    res.status(500).send('Error downloading video: ' + (err.message || String(err)));
  }
}