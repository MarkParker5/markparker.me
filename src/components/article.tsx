import Head from 'next/head'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { ArticleLayout } from './article-layout'
import { ArticlesList } from './articles-list'
import { Separator } from './separator'
import { ArticleMeta, getArticleDirectUrl, getPublicArticles } from '../article'
import { getProjectById } from '../project'
import { ARTICLE_INTERACTION_PLATFORMS } from '../interactions'
import { articleTitleTransitionStyle, articleMetaTransitionStyle } from './articles-list'
import { InteractionBar } from './interaction-bar'
import { Link } from './link'
import { addCopyButtons } from '../general/add-snippet-copy'
import { trackOutboundClick, useReadTracking } from '../analytics'

// Import Highlight.js languages
import hljs from 'highlight.js/lib/core'
import shell from 'highlight.js/lib/languages/shell'
import python from 'highlight.js/lib/languages/python'
import swift from 'highlight.js/lib/languages/swift'
import javascript from 'highlight.js/lib/languages/javascript'
import php from 'highlight.js/lib/languages/php'
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('python', python)
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('php', php)

type Props = PropsWithChildren<{
  article: ArticleMeta
}>

// A hardcoded "Back to home" always pointed to `/`, even when you actually
// arrived from /blog, a filtered search, or another article's "Related"
// link — landing back on the homepage instead of where you really came
// from. `router.back()` goes to the real previous entry in *this* session's
// history when there is one (same-origin referrer); otherwise falls back to
// /blog, a better default for "an article" than the homepage.
function BackLink() {
  const [hasHistory, setHasHistory] = useState(false)

  useEffect(() => {
    const cameFromThisSite = document.referrer && new URL(document.referrer).origin === window.location.origin
    setHasHistory(Boolean(cameFromThisSite && window.history.length > 1))
  }, [])

  // No underline (a `style={1}`/`style={2}` Link both add one) — a pill
  // with its own hover fill reads as a real control, not a text link, and
  // an underlined arrow glyph looked broken/accidental rather than styled.
  const className =
    'group inline-flex items-center gap-2 text-sm font-medium text-muted-light dark:text-muted-dark ' +
    'hover:text-primary-light dark:hover:text-primary-dark duration-150'
  const arrow = (
    <span
      className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0
                 group-hover:-translate-x-0.5 group-hover:border-primary-light dark:group-hover:border-primary-dark
                 transition-all duration-150"
    >
      <i className="fas fa-arrow-left text-[0.65rem]" />
    </span>
  )

  if (hasHistory) {
    return (
      <button onClick={() => window.history.back()} className={className}>
        {arrow}
        Back
      </button>
    )
  }

  return (
    <Link href="/blog" className={className}>
      {arrow}
      Back to Blog
    </Link>
  )
}

function ArticleInteractionBar({
  article,
  large,
  showFollow,
}: {
  article: ArticleMeta
  large?: boolean
  showFollow?: boolean
}) {
  return (
    <InteractionBar
      contentType="article"
      contentId={article.id}
      platforms={ARTICLE_INTERACTION_PLATFORMS}
      getDirectUrl={(platform) => getArticleDirectUrl(platform, article)}
      composeText={article.title}
      shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${article.id}`}
      large={large}
      showFollow={showFollow}
    />
  )
}

export function ArticleComponent({ article, children }: Props) {
  const router = useRouter()
  useReadTracking('article', article.id)

  useEffect(() => {
    hljs.initHighlighting()
    addCopyButtons()
  }, [])

  return (
    <ArticleLayout>
      <Head>
        <title>{article.title + ' — Mark Parker'}</title>
        <meta name="og:title" content={article.title + ' — Mark Parker'} />
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
        <link
          rel="stylesheet"
          href="/highlight/styles/atom-one-dark.min.css"
          media="(prefers-color-scheme: dark)"
        />
      </Head>

      {<TwitterTweetButton text={article.title} path={router.asPath} />}

      <BackLink />

      {article.mirrors && article.mirrors.length > 0 && (
        <>
          <div className="mt-5 mb-3">
            <p className="mb-2">Read on:</p>
            <ArticleMirrors article={article} />
          </div>
        </>
      )}

      <div className="mb-3 mt-1">
        <h1 className="text-3xl leading-tight font-bold" style={articleTitleTransitionStyle(article.id)}>
          {article.title}
        </h1>
        <div
          className="italic mt-1 text-md text-muted-light dark:text-muted-dark flex flex-wrap items-center gap-x-3"
          style={articleMetaTransitionStyle(article.id)}
        >
          <span>
            Published on {article.date_pretty} · {article.read_time} read
          </span>
          {article.relatedProjectId &&
            (() => {
              const project = getProjectById(article.relatedProjectId)
              return project ? (
                <Link
                  href={`/projects#${project.id}`}
                  className="not-italic inline-flex items-center gap-1.5 hover:text-primary-light dark:hover:text-primary-dark"
                >
                  <i className="fas fa-diagram-project text-xs" />
                  {project.title}
                </Link>
              ) : null
            })()}
        </div>
        {/* Duplicated at the bottom too — a reader shouldn't have to scroll
            past a long article just to like/share it. */}
        <div className="mt-3">
          <ArticleInteractionBar article={article} />
        </div>
      </div>

      <div className="markdown mb-10">{children}</div>

      <div className="flex justify-center mb-5">
        <ArticleInteractionBar article={article} large showFollow />
      </div>

      {article.mirrors && article.mirrors.length > 0 && (
        <>
          <div className="mt-5 mb-3 text-center">
            <p className="mb-2">Follow on:</p>
            <ArticleMirrors article={article} />
          </div>
        </>
      )}

      {/* <div>
        <div className="text-center mb-10">
          {article.tweetId ? (
            <>
              <Link
                style={2}
                href={`https://twitter.com/MarkParker_5/status/${article.tweetId}`}
                newTab
              >
                Comment
              </Link>{' '}
              this post on Twitter
            </>
          ) : (
            <>
              Follow me on{' '}
              <Link style={2} href="https://twitter.com/MarkParker_5" newTab>
                Twitter
              </Link>{' '}
              and{' '}
              <Link style={2} href={makeTwitterUrl(article.title, router.asPath)} newTab>
                Share
              </Link>{' '}
              this post
            </>
          )}
        </div>
      </div> */}

      <Separator />

      <OtherArticles currentArticleId={article.id} />
    </ArticleLayout>
  )
}

function ArticleMirrors({ article }: { article: ArticleMeta }) {
  return (
    <div className="inline-flex gap-5 items-center flex-wrap">
      {article.mirrors.map((mirror) => (
        <a
          key={mirror.url}
          href={mirror.url}
          title={mirror.title}
          className=""
          target="_blank"
          rel="noreferrer"
          onClick={() => trackOutboundClick(mirror.title.toLowerCase(), `article.${article.id}`)}
        >
          <i className={`${mirror.icon} fa-xl`} />
        </a>
      ))}
    </div>
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
      <h4 className="text-l mb-4">Other articles:</h4>
      <ArticlesList articles={articles} />
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
      {caption && <div className="mt-1 text-center text-lg text-muted-light dark:text-muted-dark">{caption}</div>}
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
      {props.caption && <div className="mt-1 text-center text-lg text-muted-light dark:text-muted-dark">{props.caption}</div>}
    </div>
  )
}
