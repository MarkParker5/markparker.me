import { GetStaticProps } from 'next'
import { streamToPromise, SitemapStream } from 'sitemap'
import { Readable } from 'stream'
import { getPublicArticles } from '../article'
import fs from 'fs'

const Sitemap = () => {
  return null
}

export const getStaticProps: GetStaticProps = async (config) => {
  const articleUrls = getPublicArticles()
    .filter((article) => !article.hidden && !article.origin)
    .map((article) => `/blog/${article.id}`)

  const urls = ['/', '/blog', '/feed.xml', ...articleUrls] as const

  const sitemapXmlString = (
    await streamToPromise(
      Readable.from(urls).pipe(
        new SitemapStream({
          hostname: `https://markparker.me`,
        }),
      ),
    )
  ).toString()

  const path = `${process.cwd()}/public/sitemap.xml`
  fs.writeFileSync(path, sitemapXmlString, 'utf8')

  console.log(`generated sitemap`)

  return {
    props: {},
  }
}

export default Sitemap
