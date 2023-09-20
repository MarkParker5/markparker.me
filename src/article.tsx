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
  date_pretty: string
  read_time: string
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
    id: 'stark-the-voice-assistants-framework',
    date: '2023-09-20',
    date_pretty: 'September 20th, 2023',
    read_time: '2 min',
    title: 'S.T.A.R.K - The First Voice Assistant\'s Framework',
    description: `I published a framework that allows you to build your own amazing voice assistant.`,
    keywords: ["python", "open-source", "natural-language-processing", "framework", "cross-platform", "natural-language", "voice", "voice-commands", "python3", "voice-recognition", "speech-recognition", "speech-to-text", "community-project", "voice-assistant", "voice-interface", "NLP", "machine-learning", "AI", "text-analysis", "stark", "stark-place", "mark parker"],
  },
  {
    id: 'inside-major-dom-v-1-0-exploring-the-architecture-of-a-new-smart-home-system',
    date: '2023-06-01',
    date_pretty: 'June 1st, 2023',
    read_time: '3 min',
    title: 'Inside MajorDom v1.0: Exploring the Architecture of a New Smart Home System',
    description: 'Exploring the Architecture of MajorDom v1.0: Dive into the inner workings of MajorDom v1.0. Learn about its core components, fault tolerance and offline capabilities.',
    keywords: ['majordom', 'smarthome', 'smart home', 'voice assistant', 'home automation', 'smart home system', 'smart devices', 'mobile development', 'backend development', 'raspberry pi', 'arduino'],
    tweetId: '1664284619909521409'
  },
  {
    id: 'building-a-smart-home-from-voice-assistant-to-major-dom-v-1-0',
    date: '2023-05-26',
    date_pretty: 'May 26th, 2023',
    read_time: '5 min',
    title: 'Building a Smart Home - from Voice Assistant to MajorDom v1.0',
    description: `The story of the origin of MajorDom: how I started creating my voice assistant and how it grew into a smart home system.`,
    keywords: ['majordom', 'smarthome', 'smart home', 'voice assistant', 'home automation', 'smart home system', 'smart devices', 'mobile development', 'backend development', 'raspberry pi', 'arduino', 'nrf24l01'],
    tweetId: '1661971621274370048'
  },
  {
    id: 'localize-ios-app-in-5-minutes',
    date: '2023-03-01',
    date_pretty: 'March 1st, 2023',
    read_time: '3 min',
    title: 'How to Localize All Your iOS Apps into 20 Languages in 5 Minutes',
    description: `I created a console tool that automatically finds all .strings files in an xcode project and translates them into all languages.`,
    keywords: ['ios', 'xcode', 'localization', 'localize', 'translate', 'ios development', 'mobile development'],
    tweetId: '1632052543613198336'
  }
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
