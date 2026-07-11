import Head from 'next/head'
import { ArticleLayout } from '../components/article-layout'
import { ProjectsList } from '../components/projects-list'
import { FilterBar } from '../components/filter-bar'
import { SectionHeader } from '../components/section-header'
import { Separator } from '../components/separator'
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
        <Head>
          <meta name="description" content={metaDescription}></meta>
          <meta name="og:title" content="Mark Parker — Projects"></meta>
          <meta name="og:description" content={metaDescription}></meta>
          <title>Mark Parker — Projects</title>
        </Head>
        <SectionHeader
          title="Projects"
          titleExtra={PROJECTS_TITLE_ICON}
          subtitle={PROJECTS_SUBTITLE}
          context="projects-page"
        />
        <FilterBar
          paramName="projects"
          contentType="projects"
          availableTags={availableTags}
          sort={{ param: 'sort', options: PROJECT_SORT_OPTIONS, defaultValue: 'interesting' }}
        />
        <ProjectsList projects={filtered} />
        <p className="text-base text-center text-muted-light dark:text-muted-dark mt-10">
          My team builds any kinds of things for clients →{' '}
          <Link style={1} href="https://parker-industries.org" newTab>
            parker-industries.org
          </Link>
        </p>
      </ArticleLayout>
    </div>
  )
}
