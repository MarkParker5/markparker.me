import { ArticleLayout } from '../components/article-layout'
import { ProjectsList } from '../components/projects-list'
import { FilterBar } from '../components/filter-bar'
import { SectionHeader } from '../components/section-header'
import { PageMeta } from '../components/page-meta'
import { getPublicProjects, TAG_ORDER, PROJECT_SORT_OPTIONS, sortProjects, ProjectSort } from '../project'
import { matchesTagExpression, useQueryParam } from '../filter'
import { Link } from '../components/link'
import { PROJECTS_TITLE_ICON, PROJECTS_SUBTITLE } from '../socials'

export default function Projects() {
  const metaDescription = 'Every project Mark Parker has built — shipped, hobby, and dead.'
  const allProjects = getPublicProjects()
  const [filter] = useQueryParam('projects')
  const [sortRaw] = useQueryParam('sort')
  const sort = (sortRaw || 'interesting') as ProjectSort
  const availableTags = Array.from(new Set(allProjects.flatMap((p) => p.tags))).sort(
    (a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b),
  )
  const filtered = sortProjects(
    allProjects.filter((p) => matchesTagExpression(p.tags, filter)),
    sort,
  )

  return (
    <div>
      <ArticleLayout>
        <PageMeta title="Mark Parker — Projects" description={metaDescription} path="/projects" />
        <SectionHeader
          title="Projects"
          titleExtra={PROJECTS_TITLE_ICON}
          subtitle={PROJECTS_SUBTITLE}
          context="projects-page"
          hideTitleOption
        />
        <FilterBar
          paramName="projects"
          contentType="projects"
          availableTags={availableTags}
          sort={{ param: 'sort', options: PROJECT_SORT_OPTIONS, defaultValue: 'interesting' }}
        />
        <ProjectsList projects={filtered} />
        <p className="text-base text-center text-muted-light dark:text-muted-dark mt-10">
          Like what you see? My team builds this kind of thing for clients too —{' '}
          <Link style={1} href="https://parker-industries.org" newTab>
            work with us →
          </Link>
        </p>
      </ArticleLayout>
    </div>
  )
}
