import { ProjectMeta, formatProjectDate } from '../project'
import { Link } from './link'
import { useReveal } from './reveal'

// A deliberately compact, picture-less project row for the homepage's "Recent
// Work" section — title + one-line date, a 2-line blurb, and the tag list.
// Same medium-style rhythm as ArticlesList, minus the thumbnail and the
// interaction bar, so several recent projects stay glanceable on one screen.
function RecentWorkRow({ project }: { project: ProjectMeta }) {
  const reveal = useReveal<HTMLLIElement>()
  const href = project.links[0]?.href ?? `/projects#${project.id}`
  const external = href.startsWith('http')
  return (
    <li ref={reveal.ref} className={`list-none ${reveal.className}`}>
      <Link href={href} newTab={external} className="block group">
        <div className="flex items-baseline justify-between gap-4">
          <span
            className="text-lg font-semibold text-primary-light dark:text-primary-dark
                       group-hover:text-link2-light dark:group-hover:text-link2-dark duration-150"
          >
            {project.title}
          </span>
          <span className="shrink-0 text-sm text-faint-light dark:text-faint-dark whitespace-nowrap">
            {formatProjectDate(project)}
          </span>
        </div>
        <span
          className="block text-base text-muted-light dark:text-muted-dark mt-1"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {project.blurb}
        </span>
        <span className="block text-sm text-faint-light dark:text-faint-dark mt-1.5">
          {project.tags.join(' · ')}
        </span>
      </Link>
    </li>
  )
}

export const RecentWorkList = ({ projects }: { projects: ProjectMeta[] }) => (
  <div className="mx-auto font-sans">
    <ul className="flex flex-col gap-5">
      {projects.map((project) => (
        <RecentWorkRow key={project.id} project={project} />
      ))}
    </ul>
  </div>
)
