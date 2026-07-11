import Document, { Head, Html, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '../components/google-analytics'

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
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
