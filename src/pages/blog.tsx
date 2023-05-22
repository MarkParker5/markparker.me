import Head from 'next/head'
import { ArticleLayout } from '../components/article-layout'
import { ArticleList } from '../components/article-list'
import { getPublicArticles } from '../article'

export default function Blog() {
  return (
    <div>
      <ArticleLayout>
        <Head>
          <title>Mark Parker — Blog</title>
        </Head>
        <ArticleList articles={getPublicArticles()} />
      </ArticleLayout>
    </div>
  )
}
