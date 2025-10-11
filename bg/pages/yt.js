import Head from 'next/head';
import YouTubeDownloader from '../components/YouTubeDownloader';

export default function Home() {
  return (
    <>
      <Head>
        <title>YouTube Video Downloader</title>
        <meta name="description" content="Download YouTube videos for personal use" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <YouTubeDownloader />
        
        {/* Footer */}
        <footer className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            For personal use only • Educational Purpose
          </p>
        </footer>
      </main>
    </>
  );
}