import { CSSProperties } from 'react'
import { Link } from './link'
import { ArticleMeta, getArticleDirectUrl } from '../article'
import { getProjectById } from '../project'
import { ARTICLE_INTERACTION_PLATFORMS } from '../interactions'
import { useReveal } from './reveal'
import { InteractionBar } from './interaction-bar'
import { Spotlight, mergeRefs, useSpotlight } from './spotlight'

// Shared with the full article page's own <h1> (components/article.tsx) —
// only for articles that actually resolve to an in-app page; a mirrored
// article (`origin` set) links straight to an external site, so there's no
// matching element on this site for the browser to morph into.
export function articleTitleTransitionStyle(articleId: string): CSSProperties {
  return { viewTransitionName: `article-heading-${articleId}` } as CSSProperties
}

// Per-article, not a single shared "hero" name — every article rendered on
// both the homepage and /blog carries its own id-derived row name (separate
// from articleTitleTransitionStyle above, which morphs just the title into
// the full article's own h1), so the browser morphs every row that appears
// on both sides, not just whichever one happened to be first. A no-op
// (unmatched name) for an article that only exists on one side.
function articleCardTransitionStyle(articleId: string): CSSProperties {
  return { viewTransitionName: `article-card-${articleId}` } as CSSProperties
}

// Matched between the homepage preview and /blog rows only — the full
// article page doesn't render a description or a thumbnail, so these are
// no-ops there, same as every other per-id name here whenever the other
// side doesn't exist.
function articleThumbnailTransitionStyle(articleId: string): CSSProperties {
  return { viewTransitionName: `article-image-${articleId}` } as CSSProperties
}
function articleDescriptionTransitionStyle(articleId: string): CSSProperties {
  return { viewTransitionName: `article-description-${articleId}` } as CSSProperties
}
// Shared with the full article page's own meta line (date · read time) —
// morphs the whole fact row into place instead of just cross-fading it.
export function articleMetaTransitionStyle(articleId: string): CSSProperties {
  return { viewTransitionName: `article-meta-${articleId}` } as CSSProperties
}

type Props = {
  articles: ArticleMeta[]
}

// Not nested inside the title's <a> — a link-inside-a-link is invalid HTML
// and would make this one unreachable/ambiguous to click. Sits as a
// sibling in the meta row below the title/excerpt instead.
function RelatedProjectBadge({ relatedProjectId }: { relatedProjectId?: string }) {
  if (!relatedProjectId) return null
  const project = getProjectById(relatedProjectId)
  if (!project) return null
  return (
    <Link
      href={`/projects#${project.id}`}
      className="inline-flex items-center gap-1.5 hover:text-primary-light dark:hover:text-primary-dark"
    >
      <i className="fas fa-diagram-project text-xs" />
      {project.title}
    </Link>
  )
}

function ArticleRow({ article }: { article: ArticleMeta }) {
  const isExternal = Boolean(article.origin)
  const href = article.origin ?? `/blog/${article.id}`
  const title = isExternal ? `${article.title}, ${new URL(article.origin!).hostname}` : article.title
  // Applied directly to the row itself (not a wrapper around its inner
  // content) for the same reason notes/projects do — see useReveal.
  const reveal = useReveal<HTMLDivElement>()
  const cursorGlow = useSpotlight<HTMLDivElement>()

  return (
    <li className="list-none">
      {/* Border-less list, so unlike notes/projects there's no "keep the
          box instant" reason to wrap only the inner content — the whole
          row fades+slides in as one unit. `relative group` (not
          `overflow-hidden`, see spotlight.tsx) hosts the cursor glow. */}
      <div
        ref={mergeRefs(reveal.ref, cursorGlow.ref)}
        onMouseMove={cursorGlow.onMouseMove}
        className={`relative group ${reveal.className}`}
        style={isExternal ? undefined : articleCardTransitionStyle(article.id)}
      >
        <Spotlight />
        <div className="flex items-start justify-between gap-4">
          <Link href={href} newTab={isExternal} className="min-w-0 flex-1 block group">
            <span
              className="block text-xl font-semibold text-primary-light dark:text-primary-dark
                         group-hover:text-link2-light dark:group-hover:text-link2-dark duration-150"
              style={isExternal ? undefined : articleTitleTransitionStyle(article.id)}
            >
              {title}
            </span>
            <span
              className="block text-base text-muted-light dark:text-muted-dark mt-1.5"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                ...(isExternal ? undefined : articleDescriptionTransitionStyle(article.id)),
              }}
            >
              {article.description}
            </span>
          </Link>
          {article.imageUrl && (
            <Link href={href} newTab={isExternal} className="shrink-0">
              <img
                src={article.imageUrl}
                alt=""
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-lg object-cover"
                style={isExternal ? undefined : articleThumbnailTransitionStyle(article.id)}
              />
            </Link>
          )}
        </div>
        <span
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-faint-light dark:text-faint-dark mt-2"
          style={isExternal ? undefined : articleMetaTransitionStyle(article.id)}
        >
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-regular fa-calendar text-xs" />
            {article.date_pretty}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-regular fa-clock text-xs" />
            {article.read_time} read
          </span>
          <RelatedProjectBadge relatedProjectId={article.relatedProjectId} />
        </span>
        {/* Same like/reply/repost/share row as notes, not just at the
            bottom of the full article — a reader deciding whether to click
            in from the list shouldn't have to open the article first to
            see there's a way to engage with it. Only for articles that
            resolve to our own /blog/[slug] page — a mirrored (`origin`
            set) entry has no id here to share. */}
        {!isExternal && (
          <div className="mt-2">
            <InteractionBar
              contentType="article"
              contentId={article.id}
              platforms={ARTICLE_INTERACTION_PLATFORMS}
              getDirectUrl={(platform) => getArticleDirectUrl(platform, article)}
              composeText={article.title}
              shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${article.id}`}
            />
          </div>
        )}
      </div>
    </li>
  )
}

// Medium/Hashnode-style row: big title + muted excerpt on the left, a small
// thumbnail on the right edge (only when imageUrl is set — the type has
// supported this for a while, nothing rendered it), a meta row of icon-led
// facts below. Three articles should stay glanceable on one screen, which
// is why the thumbnail is small and fixed-size rather than a full-width
// hero image (that's Habr's pattern — one screen, one article, not what we
// want here).
export const ArticlesList = ({ articles }: Props) => (
  <div className="mx-auto font-sans">
    {/* gap-6 (1.5rem) + ~8% */}
    <ul className="flex flex-col gap-[1.625rem]">
      {articles.map((article) => (
        <ArticleRow key={article.id} article={article} />
      ))}
    </ul>
  </div>
)
