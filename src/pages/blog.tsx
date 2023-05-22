import Head from 'next/head'
import { ArticleLayout } from '../components/article-layout'
import { ArticlesList } from '../components/articles-list'
import { getPublicArticles } from '../article'

export default function Blog() {
  return (
    <div>
      <ArticleLayout>
        <Head>
          <title>Mark Parker — Blog</title>
        </Head>
        <ArticlesList articles={getPublicArticles()} />
      </ArticleLayout>
    </div>
  )
}
