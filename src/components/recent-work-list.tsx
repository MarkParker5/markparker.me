import { CSSProperties } from 'react'
import { ProjectMeta, formatProjectDate } from '../project'
import { Link } from './link'
import { useReveal } from './reveal'
import { Spotlight, mergeRefs, useSpotlight } from './spotlight'

// Same per-project view-transition name ProjectsList uses, so a Recent Work row
// morphs into that project's card on /projects (and vice-versa) instead of just
// cross-fading. Safe because Recent Work is deduped against the Projects
// preview — a given id renders in at most one section per page.
function projectCardTransitionStyle(projectId: string): CSSProperties {
  return { viewTransitionName: `project-card-${projectId}` } as CSSProperties
}

// A deliberately compact, picture-less project row for the homepage's "Recent
// Work" section — title + date, a 2-line blurb, the tag list. Same reveal +
// cursor-glow (Spotlight) hover as ProjectsList/ArticlesList, just without the
// thumbnail and interaction bar.
function RecentWorkRow({ project }: { project: ProjectMeta }) {
  const reveal = useReveal<HTMLDivElement>()
  const cursorGlow = useSpotlight<HTMLDivElement>()
  const href = project.links[0]?.href ?? `/projects#${project.id}`
  const external = href.startsWith('http')
  const date = formatProjectDate(project)
  return (
    <li className="list-none">
      <div
        ref={mergeRefs(reveal.ref, cursorGlow.ref)}
        onMouseMove={cursorGlow.onMouseMove}
        className={`relative group ${reveal.className}`}
        style={projectCardTransitionStyle(project.id)}
      >
        <Spotlight />
        <Link href={href} newTab={external} className="block">
          <div className="flex items-baseline justify-between gap-4">
            <span
              className="text-lg font-semibold text-primary-light dark:text-primary-dark
                         group-hover:text-link2-light dark:group-hover:text-link2-dark duration-150"
            >
              {project.title}
            </span>
            {date && (
              <span className="shrink-0 text-sm text-faint-light dark:text-faint-dark whitespace-nowrap">{date}</span>
            )}
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
      </div>
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
