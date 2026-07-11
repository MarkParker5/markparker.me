import Head from 'next/head'
import { Profile } from '../components/profile'
import { ArticlesList } from '../components/articles-list'
import { ProjectsList } from '../components/projects-list'
import { NotesList } from '../components/notes-list'
import { SectionHeader } from '../components/section-header'
import { PageContainer } from '../components/page-container'
import { getPublicArticles } from '../article'
import { getSpotlightProjects } from '../project'
import { getPreviewNotes } from '../note'
import { Link } from '../components/link'
import { useQueryParam, matchesTagExpression } from '../filter'
import {
  NOTES_ACCOUNTS,
  NOTES_SUBTITLE,
  BLOG_ACCOUNTS,
  BLOG_SUBTITLE,
  BLOG_EXTRA_LINK,
  PROJECTS_TITLE_ICON,
  PROJECTS_SUBTITLE,
} from '../socials'

function withParam(path: string, paramName: string, value: string) {
  if (!value) return path
  return `${path}?${paramName}=${encodeURIComponent(value)}`
}

export default function Index() {
  const metaDescription = 'Mark Parker — Engineer, co-founder of Parker Industries'

  // The homepage accepts the same filter params as each full content page,
  // applied to that section's preview with identical logic — a filtered
  // homepage link (e.g. for a hardware-focused job application) is just
  // this same mechanism, one level up. Default (no params) is exactly the
  // page below.
  const [notesFilter] = useQueryParam('notes')
  const [projectsFilter] = useQueryParam('projects')
  const [articlesFilter] = useQueryParam('articles')

  const notesPreview = getPreviewNotes(3).filter((n) => matchesTagExpression(n.tags ?? [], notesFilter))

  const spotlightProjects = getSpotlightProjects().filter((p) =>
    matchesTagExpression(p.tags, projectsFilter),
  )

  const latestArticles = getPublicArticles()
    .filter((a) => matchesTagExpression(a.tags ?? [], articlesFilter))
    .slice(0, 3)

  return (
    <PageContainer>
      <Head>
        <meta charSet="utf-8"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <meta
          name="keywords"
          content="Mark Parker, Parker Programs, Parker Industries, developer, software engineer, engineer"
        ></meta>
        <meta name="og:title" content="Mark Parker"></meta>
        <meta name="og:image" content="https://markparker.me/mark-parker.jpg"></meta>
        <meta name="og:description" content={metaDescription}></meta>
        <meta name="description" content={metaDescription}></meta>
        <title>Mark Parker</title>
      </Head>

      <div className="mx-auto flex lg:flex-row flex-col">
        <div className="mt-5 lg:w-[26rem] lg:flex-shrink-0">
          <Profile />
        </div>
        <div className="mt-10 lg:flex-1 lg:mx-10">
          {notesPreview.length > 0 && (
            <>
              <SectionHeader
                id="notes-section"
                title="Posts"
                href="/notes"
                subtitle={NOTES_SUBTITLE}
                icons={NOTES_ACCOUNTS}
                context="home.notes"
                divider
              />
              <NotesList notes={notesPreview} />
              <p className="text-center font-serif mt-4 mb-10">
                <Link
                  style={2}
                  href={withParam('/notes', 'notes', notesFilter)}
                  className="text-xl font-semibold"
                >
                  All posts →
                </Link>
              </p>
            </>
          )}

          {spotlightProjects.length > 0 && (
            <>
              <SectionHeader
                id="projects-section"
                title="Projects"
                href="/projects"
                titleExtra={PROJECTS_TITLE_ICON}
                subtitle={PROJECTS_SUBTITLE}
                context="home.projects"
                divider
              />
              <ProjectsList projects={spotlightProjects} />
              <p className="text-center font-serif mt-4 mb-10">
                <Link
                  style={2}
                  href={withParam('/projects', 'projects', projectsFilter)}
                  className="text-xl font-semibold"
                >
                  All projects →
                </Link>
              </p>
            </>
          )}

          <SectionHeader
            id="blog-section"
            title="Blog"
            href="/blog"
            subtitle={BLOG_SUBTITLE}
            icons={BLOG_ACCOUNTS}
            extraLink={BLOG_EXTRA_LINK}
            context="home.blog"
            divider
          />
          <ArticlesList articles={latestArticles} />
          <p className="text-center font-serif mt-4">
            <Link
              style={2}
              href={withParam('/blog', 'articles', articlesFilter)}
              className="text-xl font-semibold"
            >
              All posts →
            </Link>
          </p>
        </div>
      </div>
    </PageContainer>
  )
}
