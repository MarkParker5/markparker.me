import Document, { Head, Html, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '../components/google-analytics'

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Global, not per-page — previously only index.tsx set these, so
              every other page (/notes, /projects, /blog, articles) rendered
              with no viewport meta at all, which can make mobile browsers
              lay out at a desktop-width default and scale the whole page
              down instead of using the real device width. */}
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <GoogleAnalytics />
          <link rel="icon" type="image/x-icon" href="/favicon.png" />
          {/* Loaded globally — every page uses FA icons somewhere (Notes/
              Blog/Projects section socials, article mirrors, contacts). */}
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          />
        </Head>
        <body className="text-primary bg-back dark:text-primary-dark dark:bg-back-dark">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
