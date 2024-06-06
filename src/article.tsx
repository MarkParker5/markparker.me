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

export type ArticleMirror = {
  url: string
  title: string
  icon: string
}

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
  imageUrl?: string

  tweetId?: string

  mediumUrl?: string
  devtoUrl?: string
  hashnodeUrl?: string
  habrUrl?: string

  mirrors: ArticleMirror[]
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
    tweetId: '',
    mediumUrl:
      'https://markparker5.medium.com/python-architecture-essentials-building-scalable-and-clean-application-for-juniors-41d59c29557c',
    devtoUrl:
      'https://dev.to/markparker5/python-architecture-essentials-building-scalable-and-clean-application-for-juniors-2o14',
    hashnodeUrl:
      'https://markparker5.hashnode.dev/python-architecture-essentials-building-scalable-and-clean-application-for-juniors',
    habrUrl: '',
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
    tweetId: '1795095306758926812',
    mediumUrl:
      'https://markparker5.medium.com/ai-powered-mobile-app-with-backend-in-two-days-mvvmp-architecture-overview-tutorial-cdaa51fb9216',
    devtoUrl:
      'https://dev.to/markparker5/ai-powered-mobile-app-with-backend-in-two-days-mvvmp-architecture-overview-tutorial-mh1',
    hashnodeUrl:
      'https://markparker5.hashnode.dev/ai-powered-mobile-app-with-backend-in-two-days-mvvmp-architecture-overview-tutorial',
    habrUrl: 'https://habr.com/ru/articles/816345/',
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
    tweetId: '1793260842437193816',
    mediumUrl:
      'https://markparker5.medium.com/dr-house-ai-diagnostician-in-your-phone-1039f8c775bb',
    devtoUrl:
      'https://dev.to/markparker5/dr-house-ai-diagnostician-in-your-phone-passing-the-startup-torch-to-capable-hands-13pf',
    hashnodeUrl: 'https://markparker5.hashnode.dev/dr-house-ai-diagnostician-in-your-phone',
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
    tweetId: '1792947045000446305',
    mediumUrl:
      'https://markparker5.medium.com/how-we-built-an-ai-startup-in-a-weekend-hackathon-in-germany-82f69c78cf86',
    devtoUrl:
      'https://dev.to/markparker5/how-we-built-an-ai-startup-in-a-weekend-hackathon-in-germany-2c3k',
    hashnodeUrl:
      'https://markparker5.hashnode.dev/how-we-built-an-ai-startup-in-a-weekend-hackathon-in-germany',
    habrUrl: 'https://habr.com/ru/articles/816327/',
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
    mediumUrl:
      'https://markparker5.medium.com/s-t-a-r-k-the-first-voice-assistants-framework-f5212cd9f87d',
    devtoUrl: 'https://dev.to/markparker5/stark-the-first-voice-assistants-framework-i8a',
    hashnodeUrl: 'https://markparker5.hashnode.dev/stark-the-first-voice-assistants-framework',
    habrUrl: 'https://habr.com/ru/articles/762252/',
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
    mediumUrl:
      'https://markparker5.medium.com/inside-majordom-v1-0-exploring-the-architecture-of-a-new-smart-home-system-946261890e83',
    devtoUrl:
      'https://dev.to/markparker5/inside-majordom-v10-exploring-the-architecture-of-a-new-smart-home-system-3i18',
    hashnodeUrl:
      'https://markparker5.hashnode.dev/inside-majordom-v10-exploring-the-architecture-of-a-new-smart-home-system',
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
    mediumUrl:
      'https://markparker5.medium.com/building-a-smart-home-from-voice-assistant-to-majordom-v1-0-fc2149490997',
    devtoUrl:
      'https://dev.to/markparker5/building-a-smart-home-from-voice-assistant-to-majordom-v10-3f3o',
    hashnodeUrl:
      'https://markparker5.hashnode.dev/building-a-smart-home-from-voice-assistant-to-majordom-v10',
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
    mediumUrl:
      'https://markparker5.medium.com/how-to-localize-all-your-ios-apps-into-20-languages-in-5-minutes-32e8ead5fe94',
    devtoUrl:
      'https://dev.to/markparker5/how-to-localize-all-your-ios-apps-into-20-languages-in-5-minutes-5b2f',
    hashnodeUrl:
      'https://markparker5.hashnode.dev/how-to-localize-all-your-ios-apps-into-20-languages-in-5-minutes',
    habrUrl: 'https://habr.com/ru/articles/722172/',
  },
].map((a) => ({
  ...a,
  mirrors: [
    ...(a.tweetId
      ? [
          {
            url: `https://twitter.com/markparker5/status/${a.tweetId}`,
            title: 'Twitter',
            icon: 'fab fa-twitter',
          },
        ]
      : []),
    ...(a.mediumUrl ? [{ url: a.mediumUrl, title: 'Medium', icon: 'fab fa-medium' }] : []),
    ...(a.hashnodeUrl ? [{ url: a.hashnodeUrl, title: 'Hashnode', icon: 'fab fa-hashnode' }] : []),
    ...(a.devtoUrl ? [{ url: a.devtoUrl, title: 'Dev.to', icon: 'fab fa-dev' }] : []),
    ...(a.habrUrl ? [{ url: a.habrUrl, title: 'Habr', icon: 'fas fa-comment' }] : []),
  ],
}))

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
