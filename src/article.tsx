import {
  ArticleComponent,
  ArticleImageProps,
  ArticleVideoProps,
  Img,
  Video,
} from './components/article'
import { JSXElementConstructor, PropsWithChildren, AnchorHTMLAttributes } from 'react'
import { Link } from './components/link'
import { MDXProvider, Components } from '@mdx-js/react'
import { Separator } from './components/separator'

export type ArticleMeta = {
  id: string
  date: string
  title: string
  description: string
  keywords: string[]

  origin?: string
  hidden?: boolean
  tweetId?: string
  imageUrl?: string
}
const articles: ArticleMeta[] = [
  {
    id: 'localize-ios-app-in-5-minutes',
    date: 'March 1st, 2023',// TODO: read time
    title: 'How to Localize All Your iOS Apps into 20 Languages in 5 Minutes',
    description: `I created a console tool that automatically finds all .strings files in an xcode project and translates them into all languages.`,
    keywords: ['ios', 'xcode', 'localization', 'localize', 'translate', 'ios development', 'mobile development'],
  },
]

export function renderArticle(
  articleId: string,
  Content: JSXElementConstructor<{ components?: Components }>,
) {
  const articleMeta = articles.find((a) => a.id === articleId)!
  const components: Components = {
    a: (props: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
      <Link href={props.href!} style={2}>
        {props.children}
      </Link>
    ),
    Img: (props: ArticleImageProps) => {
      const src = props.src.startsWith('@')
        ? `/articles/${articleMeta.id}/${props.src.replace('@', '')}`
        : props.src
      return <Img {...props} src={src} />
    },
    Video: (props: ArticleVideoProps) => {
      const src = props.src.startsWith('@')
        ? `/articles/${articleMeta.id}/${props.src.replace('@', '')}`
        : props.src
      return <Video {...props} src={src} />
    },
    Link,
    Separator,
  }
  return (
    <ArticleComponent article={articleMeta}>
      <MDXProvider components={components}>
        <Content />
      </MDXProvider>
    </ArticleComponent>
  )
}

export function getAllArticles() {
  return articles
}

export function getPublicArticles() {
  return articles.filter((post) => !post.hidden)
}

export function getRandomArticles(number: number, exceptArticleId: string) {
  return shuffle(getPublicArticles().filter((a) => a.id !== exceptArticleId)).slice(0, number)
}

function shuffle<T>(b: T[]): T[] {
  const a = [...b]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
