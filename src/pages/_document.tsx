import Document, { Head, Html, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '../components/google-analytics'

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <GoogleAnalytics />
          <link rel="icon" type="image/x-icon" href="/favicon.png" />
        </Head>
        <body className="text-primary bg-back dark:text-primary-dark dark:bg-back-dark">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
