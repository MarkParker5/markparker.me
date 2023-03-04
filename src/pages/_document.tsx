import Document, { Head, Html, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '../components/google-analytics'

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <GoogleAnalytics />
          <link rel="icon" type="image/x-icon" href="/favicon.png" />
          {/* Highlight.js */}
          <link rel="stylesheet" href="/highlight/styles/atom-one-light.min.css" />
          <link rel="stylesheet" href="/highlight/styles/atom-one-dark.min.css" media="(prefers-color-scheme: dark)" />
          <script src="/highlight/highlight.min.js" />
        </Head>
        <body className="text-primary bg-back dark:text-primary-dark dark:bg-back-dark">
          <Main />
          <NextScript />
          <script>hljs.initHighlightingOnLoad();</script>
          <script src="/add-snippet-copy.js" />
        </body>
      </Html>
    )
  }
}
