import Document, { Head, Html, Main, NextScript } from 'next/document'
import { PosthogAnalytics } from '../components/posthog'

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <PosthogAnalytics />
          <link rel="icon" type="image/x-icon" href="/favicon.png" />
        </Head>
        <body className="text-primary">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
