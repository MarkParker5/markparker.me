import Head from 'next/head'
import { useRouter } from 'next/router'
import { ArticleLayout } from '../components/articles-layout'
import { ArticleList } from '../components/article-list'
import { Separator } from './separator'
import { ArticleMeta, getPublicArticles } from '../article'
import { Link } from './link'
import { PropsWithChildren } from 'react'
import { useEffect } from "react"

// Import Highlight.js languages
import hljs from 'highlight.js/lib/core';
import shell from 'highlight.js/lib/languages/shell';
import python from 'highlight.js/lib/languages/python';
import swift from 'highlight.js/lib/languages/swift';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('python', python);
hljs.registerLanguage('swift', swift);


type Props = PropsWithChildren<{
  article: ArticleMeta
}>

export function ArticleComponent({ article, children }: Props) {
  const router = useRouter()

  useEffect(() => {
    hljs.initHighlighting();
  }, []);
  
  return (
    <ArticleLayout>
      <Head>
        <title>{article.title + ' — Mark Parker'}</title>
        <meta name="og:title" content={article.title} />
        <meta name="og:image" content={`https://markparker.me/articles/${article.id}/meta.jpg`} />

        <meta name="description" content={article.description} />
        <meta name="og:description" content={article.description} />
        <meta name="keywords" content={article.keywords.join(',')} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={`https://markparker.me/articles/${article.id}/meta.jpg`}
        />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.description} />

        {/* Highlight.js  */}
        <link rel="stylesheet" href="/highlight/styles/atom-one-light.min.css" />
        <link rel="stylesheet" href="/highlight/styles/atom-one-dark.min.css" media="(prefers-color-scheme: dark)" />
      </Head>
      
      {<TwitterTweetButton text={article.title} path={router.asPath} />}
      
      <Link style={1} href="/blog">
        {'<'} Back to the list
      </Link>
      
      <div className="mb-12">
        <h1 className="text-5xl leading-tight">{article.title}</h1>
        <div className="italic">Published on {article.date}</div>
      </div>

      <div className="markdown mb-10">{children}</div>

      <Separator />

      <div>
        <div className="text-center mb-10">
          {article.tweetId ? (
            <>
              <Link
                style={2}
                href={`https://twitter.com/MarkParker_5/status/${article.tweetId}`}
                newTab
              >
                Discuss
              </Link>{' '}
              or{' '}
              <Link style={2} href={makeTwitterUrl(article.title, router.asPath)} newTab>
                Share
              </Link>{' '}
              on Twitter
            </>
          ) : (
            <>
              Follow me on{' '}
              <Link style={2} href="https://twitter.com/MarkParker_5" newTab>
                Twitter
              </Link>{' '}
              or{' '}
              <Link style={2} href={makeTwitterUrl(article.title, router.asPath)} newTab>
                Share
              </Link>{' '}
              this post
            </>
          )}
        </div>
      </div>

      <OtherArticles currentArticleId={article.id} />

    </ArticleLayout>
  )
}

function OtherArticles({ currentArticleId }: { currentArticleId: string }) {
  // const articles = getRandomArticles(3, currentArticleId)
  const articles = getPublicArticles()
    .filter((a) => a.id !== currentArticleId)
    .slice(0, 3)

  if (articles.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-l mb-4">Other articles:</h3>
      <ArticleList articles={articles} />
    </div>
  )
}

function makeTwitterUrl(text: string, path: string) {
  const siteUrl = new URL('https://markparker.me')
  // eslint-disable-next-line immutable/no-mutation
  siteUrl.pathname = path

  const twitterUrl = new URL('https://twitter.com/intent/tweet')
  twitterUrl.searchParams.append('text', text)
  twitterUrl.searchParams.append('url', siteUrl.toString())
  twitterUrl.searchParams.append('via', 'MarkParker_5')

  return twitterUrl.toString()
}

type TwitterTweetButtonProps = {
  text: string
  path: string
}

function TwitterTweetButton(props: TwitterTweetButtonProps) {
  const twitterUrl = makeTwitterUrl(props.text, props.path)

  return (
    <a
      style={{ position: 'fixed', top: 0, left: '80%', width: '50px' }}
      target="_blank"
      rel="noreferrer noopener"
      href={twitterUrl.toString()}
    >
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        viewBox="0 0 455.731 455.731"
        xmlSpace="preserve"
      >
        {' '}
        <g>
          {' '}
          <rect x={0} y={0} style={{ fill: '#333' }} width="455.731" height="455.731" />{' '}
          <path
            style={{ fill: '#FFFFFF' }}
            d="M60.377,337.822c30.33,19.236,66.308,30.368,104.875,30.368c108.349,0,196.18-87.841,196.18-196.18
              c0-2.705-0.057-5.39-0.161-8.067c3.919-3.084,28.157-22.511,34.098-35c0,0-19.683,8.18-38.947,10.107
              c-0.038,0-0.085,0.009-0.123,0.009c0,0,0.038-0.019,0.104-0.066c1.775-1.186,26.591-18.079,29.951-38.207
              c0,0-13.922,7.431-33.415,13.932c-3.227,1.072-6.605,2.126-10.088,3.103c-12.565-13.41-30.425-21.78-50.25-21.78
              c-38.027,0-68.841,30.805-68.841,68.803c0,5.362,0.617,10.581,1.784,15.592c-5.314-0.218-86.237-4.755-141.289-71.423
              c0,0-32.902,44.917,19.607,91.105c0,0-15.962-0.636-29.733-8.864c0,0-5.058,54.416,54.407,68.329c0,0-11.701,4.432-30.368,1.272
              c0,0,10.439,43.968,63.271,48.077c0,0-41.777,37.74-101.081,28.885L60.377,337.822z"
          />{' '}
        </g>{' '}
        <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{' '}
        <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{' '}
      </svg>
    </a>
  )
}

export type ArticleImageProps = {
  src: string
  className?: string
  alt?: string
  caption?: string
  captionJsx?: JSX.Element
}

export function Img(props: ArticleImageProps) {
  const caption = props.captionJsx ?? props.caption
  return (
    <div className={`${props.className} flex flex-col items-center justify-center`}>
      <a href={props.src} target="_blank" rel="noreferrer">
        <img src={props.src} alt={props.alt ?? props.caption} className="w-full" />
      </a>
      {caption && <div className="mt-1 text-center text-lg text-opaque">{caption}</div>}
    </div>
  )
}

export type ArticleVideoProps = {
  src: string
  className?: string
  alt?: string
  caption?: string
}

export function Video(props: ArticleVideoProps) {
  return (
    <div className={`${props.className} mt-3 flex flex-col items-center justify-center`}>
      <video autoPlay playsInline loop muted src={props.src}></video>
      {props.caption && <div className="mt-1 text-center text-lg text-opaque">{props.caption}</div>}
    </div>
  )
}
