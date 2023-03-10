import { Feed } from 'feed'
import { GetStaticProps } from 'next'
import { getPublicArticles } from '../article'
import fs from 'fs'

const FeedComponent = () => {
  return null
}

export const getStaticProps: GetStaticProps = async () => {
  const author = {
    name: 'Mark Parker',
    email: 'mark@parker-programs.com',
    link: 'https://markparker.me',
  }

  const feed = new Feed({
    title: 'Mark Parker',
    description: "Mark Parker's blog",
    id: 'https://markparker.me/blog',
    link: 'https://markparker.me/blog',
    language: 'en',
    image: 'https://markparker.me/mark-parker.jpg',
    favicon: 'https://markparker.me/favicon.png',
    copyright: 'All rights reserved 2023, Mark Parker',
    updated: new Date('2023-03-04'),
    generator: '---',
    feedLinks: {
      atom: 'https://markparker.me/feed.xml',
    },
    author,
  })

  const articles = getPublicArticles().filter((article) => !article.hidden && !article.origin)

  for (const article of articles) {
    feed.addItem({
      title: article.title,
      id: `https://markparker.me/blog/${article.id}`,
      link: `https://markparker.me/blog/${article.id}`,
      description: article.description,
      image: article.imageUrl,
      date: new Date(article.date),
      author: [author],
    })
  }

  const path = `${process.cwd()}/public/feed.xml`
  fs.writeFileSync(path, feed.atom1(), 'utf8')
  console.log('generated feed.xml')

  return {
    props: {},
  }
}

export default FeedComponent
