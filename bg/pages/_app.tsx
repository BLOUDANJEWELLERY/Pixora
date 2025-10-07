// pages/_app.tsx:
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return(
<>
     <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.PNG" />

        {/* App logo for mobile devices */}
        <link rel="apple-touch-icon" href="/favicon.PNG" />

        {/* Page title */}
        <title>Pixora — AI Image Editing & Background Tools</title>

        {/* Meta description */}
        <meta
          name="description"
          content="Edit, resize, crop, and enhance your images instantly. Remove backgrounds, extend them, and convert formats with ease."
        />

        {/* Optional: Open Graph for social sharing */}
        <meta property="og:title" content="Pixora — AI Image Editing & Background Tools" />
        <meta
          property="og:description"
          content="Powerful online tools to remove and extend backgrounds, crop, resize, and convert your images effortlessly."
        />
        <meta property="og:image" content="/preview.png" />
        <meta property="og:type" content="website" />

        {/* Optional: Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pixora — AI Image Editing & Background Tools" />
        <meta
          name="twitter:description"
          content="AI-powered tools to edit, resize, crop, and enhance your images instantly."
        />
        <meta name="twitter:image" content="/preview.png" />
      </Head>
 <Component {...pageProps} />
</>
);

}
