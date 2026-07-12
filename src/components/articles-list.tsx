import { Link } from './link'
import { ArticleMeta } from '../article'
import { getProjectById } from '../project'
import { Reveal } from './reveal'

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
      {articles.map((article) => {
        const isExternal = Boolean(article.origin)
        const href = article.origin ?? `/blog/${article.id}`
        const title = isExternal ? `${article.title}, ${new URL(article.origin!).hostname}` : article.title

        return (
          <li key={article.id} className="list-none">
            {/* Border-less list, so unlike notes/projects there's no "keep
                the box instant" reason to wrap only the inner content —
                the whole row fades+slides in as one unit. */}
            <Reveal>
              <div className="flex items-start justify-between gap-4">
                <Link href={href} newTab={isExternal} className="min-w-0 flex-1 block group">
                  <span
                    className="block text-xl font-semibold text-primary-light dark:text-primary-dark
                               group-hover:text-link2-light dark:group-hover:text-link2-dark duration-150"
                  >
                    {title}
                  </span>
                  <span
                    className="block text-base text-muted-light dark:text-muted-dark mt-1.5"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
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
                    />
                  </Link>
                )}
              </div>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-faint-light dark:text-faint-dark mt-2">
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
            </Reveal>
          </li>
        )
      })}
    </ul>
  </div>
)
