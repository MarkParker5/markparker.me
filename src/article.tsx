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
import { title } from 'process'

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
    id: 'python-architecture-essentials-building-scalable-and-clean-application-for-juniors',
    date: '2024-5-18',
    date_pretty: 'May 18th, 2024',
    read_time: '20 min',
    title: 'Python Architecture Essentials: Building Scalable and Clean Applications for Juniors',
    description:
      'Dive into the fundamentals of scalable and clean application architecture in Python. Here, we explore essential concepts of OOP, SOLID principles, and Dependency Injection with practical examples of a real application structure.',
    keywords: [
      'python architecture',
      'application structure',
      'clean code in Python',
      'SOLID principles Python',
      'scalable Python applications',
      'project structure',
      'code design patterns',
      'dependency injection',
      'dependency injection python',
      'python code maintainability',
      'object-oriented programming Python',
      'python type annotations',
      'Python application layers',
      'OOP vs procedural Python',
      'python development best practices',
      'python modularity',
      'layered architecture',
      'python dependency management',
      'python',
      'python project structure',
      'service vs provider',
      'clean architecture',
      'software design',
      'coding standards',
      'project organization',
      'interface segregation',
      'single responsibility principle',
      'abstraction',
      'protocol',
    ],
  },
  {
    id: 'ai-powered-mobile-app-with-backend-in-two-days-tutorial',
    date: '2024-5-5',
    date_pretty: 'May 5th, 2024',
    read_time: '15 min',
    title: 'AI-powered Mobile App with Backend in Two Days (Tutorial)',
    description:
      "This article delves into the nuts and bolts of creating a Proof of Concept (PoC) of a mobile app built with SwiftUI framework and a backend using FastAPI. As an extra, I'll demonstrate effective architecture patterns for SwiftUI apps, specifically MVVMP combined with SOLID principles and Dependency Injection (DI). For android, the code can be easily translated to Kotlin using Jetpack Compose Framework almost without changes.",
    keywords: [
      'AI app development',
      'AI startup development',
      'Backend for mobile app',
      'ChatGPT in mobile apps',
      'clean code',
      'Code architecture in app development',
      'Debugging',
      'Decoupling',
      'Dependency Injection',
      'Design patterns',
      'DRY principle',
      'Encapsulation',
      'FastAPI',
      'FastAPI backend development',
      'good software architecture',
      'Hackathon',
      'Hackathon project guide',
      'Healthcare mobile app development',
      'iOS app',
      'iOS app development',
      'KISS principle',
      'Minimal Viable Product development',
      'MVP',
      'OpenAI API integration',
      'PoC',
      'Proof of Concept app',
      'Proof of Concept app development',
      'Protocol-oriented programming',
      'Python',
      'Rapid prototyping',
      'Refactoring',
      'software architecture',
      'Software development best practices',
      'Software engineering',
      'SwiftUI',
      'SwiftUI MVVMP pattern',
      'SwiftUI tutorial',
      'Tutorial for app developers',
      'Xcode',
    ],
    tweetId: '',
  },
  {
    id: 'house-md-ai-diagnostician-in-your-phone-passing-the-torch-and-entrusting-a-startup-to-capable-hands',
    date: '2024-5-4',
    date_pretty: 'May 4th, 2024',
    read_time: '4 min',
    title:
      'Dr. House — AI Diagnostician in your phone. Passing the Torch and Entrusting a Startup to Capable Hands',
    description:
      'This article picks up where the previous one left off, [How We Built an AI Startup in a Weekend Hackathon in Germany], focusing more on the final product rather than the hackathon process itself.',
    keywords: [
      'AI diagnostician',
      'Dr. House AI',
      'healthcare AI',
      'medical diagnosis app',
      'healthcare technology',
      'virtual assistant app',
      'health tech startup',
      'medical AI product',
      'AI healthcare solutions',
      'healthcare innovation',
      'medical app development',
      'speech-based diagnosis',
      'remote healthcare solutions',
      'mobile healthcare app',
      'ethical AI in healthcare',
      'healthcare accessibility',
      'startup handover',
      'startup legacy',
      'entrepreneurship transition',
      'startup succession',
      'public domain release',
      'GitHub repository',
      'healthcare technology integration',
      'health data interoperability',
      'medical device integration',
      'remote patient monitoring',
      'health information exchange',
      'health literacy improvement',
      'emergency medical app',
    ],
    tweetId: '',
  },
  {
    id: 'how-we-built-an-ai-startup-in-a-weekend-hackathon-in-germany',
    date: '2024-5-4',
    date_pretty: 'May 4th, 2024',
    read_time: '9 min',
    title: 'How We Built an AI Startup in a Weekend Hackathon in Germany',
    description:
      "Here's a rundown of my weekend at a Cologne hackathon, where we aimed to start an AI startup in just two days. We went from pitching ideas on Friday night to demoing a working app by Sunday. It involved coding late into the night, figuring out last-minute tech snags, and even putting together a presentation minutes before our demo. As a bonus, I have highlighted a to-do list of the main points for creating a startup.",
    keywords: [
      'AI startup',
      'startup tutorial',
      'hackathon overview',
      'Cologne hackathon',
      'AI Startup Hackathon',
      'Startplatz',
      'MediaPark',
      'startup weekend',
      'startup creation',
      'weekend hackathon',
      'startup development',
      'startup ideation',
      'startup formation',
      'startup pitching',
      'startup presentation',
      'customer development',
      'proof of concept',
      'business model',
      'monetization model',
      'target audience',
      'unique value proposition',
      'minimum viable product',
      'software development',
      'teamwork skills',
      'network expansion',
      'hackathon experience',
      'technology iteration',
      'public domain release',
      'GitHub repository',
      'hackathon advice',
    ],
    tweetId: '',
  },
  {
    id: 'stark-the-voice-assistants-framework',
    date: '2023-09-20',
    date_pretty: 'September 20th, 2023',
    read_time: '2 min',
    title: "S.T.A.R.K - The First Voice Assistant's Framework",
    description: `I published a framework that allows you to build your own amazing voice assistant.`,
    keywords: [
      'python',
      'open-source',
      'natural-language-processing',
      'framework',
      'cross-platform',
      'natural-language',
      'voice',
      'voice-commands',
      'python3',
      'voice-recognition',
      'speech-recognition',
      'speech-to-text',
      'community-project',
      'voice-assistant',
      'voice-interface',
      'NLP',
      'machine-learning',
      'AI',
      'text-analysis',
      'stark',
      'stark-place',
      'mark parker',
    ],
    tweetId: '1704418665335021942',
  },
  {
    id: 'inside-major-dom-v-1-0-exploring-the-architecture-of-a-new-smart-home-system',
    date: '2023-06-01',
    date_pretty: 'June 1st, 2023',
    read_time: '3 min',
    title: 'Inside MajorDom v1.0: Exploring the Architecture of a New Smart Home System',
    description:
      'Exploring the Architecture of MajorDom v1.0: Dive into the inner workings of MajorDom v1.0. Learn about its core components, fault tolerance and offline capabilities.',
    keywords: [
      'majordom',
      'smarthome',
      'smart home',
      'voice assistant',
      'home automation',
      'smart home system',
      'smart devices',
      'mobile development',
      'backend development',
      'raspberry pi',
      'arduino',
    ],
    tweetId: '1664284619909521409',
  },
  {
    id: 'building-a-smart-home-from-voice-assistant-to-major-dom-v-1-0',
    date: '2023-05-26',
    date_pretty: 'May 26th, 2023',
    read_time: '5 min',
    title: 'Building a Smart Home - from Voice Assistant to MajorDom v1.0',
    description: `The story of the origin of MajorDom: how I started creating my voice assistant and how it grew into a smart home system.`,
    keywords: [
      'majordom',
      'smarthome',
      'smart home',
      'voice assistant',
      'home automation',
      'smart home system',
      'smart devices',
      'mobile development',
      'backend development',
      'raspberry pi',
      'arduino',
      'nrf24l01',
    ],
    tweetId: '1661971621274370048',
  },
  {
    id: 'localize-ios-app-in-5-minutes',
    date: '2023-03-01',
    date_pretty: 'March 1st, 2023',
    read_time: '3 min',
    title: 'How to Localize All Your iOS Apps into 20 Languages in 5 Minutes',
    description: `I created a console tool that automatically finds all .strings files in an xcode project and translates them into all languages.`,
    keywords: [
      'ios',
      'xcode',
      'localization',
      'localize',
      'translate',
      'ios development',
      'mobile development',
    ],
    tweetId: '1632052543613198336',
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
