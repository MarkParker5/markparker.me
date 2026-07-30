import Head from 'next/head'
import { Profile } from '../components/profile'
import { ArticlesList } from '../components/articles-list'
import { ProjectsList } from '../components/projects-list'
import { RecentWorkList } from '../components/recent-work-list'
import { NotesList } from '../components/notes-list'
import { SectionHeader } from '../components/section-header'
import { Reveal } from '../components/reveal'
import { PageContainer, CONTENT_MAX_WIDTH_CLASS } from '../components/page-container'
import { getPublicArticles } from '../article'
import { getPublicProjects, sortProjects } from '../project'
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

  // Homepage features the 3 most interesting projects (the `spotlight`
  // flag that used to pick these is gone — same "interesting first"
  // signal as the /projects default, so one source of truth). Tag-filter
  // first, THEN take the top 3, so a filtered homepage link surfaces the
  // best 3 *within* that filter rather than filtering the global top 3
  // down to however many happen to match.
  const projectsPreview = sortProjects(
    getPublicProjects().filter((p) => matchesTagExpression(p.tags, projectsFilter)),
    'interesting',
  ).slice(0, 3)

  // Compact "Recent Work" strip (above Projects) — the most-recently-STARTED
  // projects (created order), minus whatever's already featured in Projects
  // below (dedup) and minus contract work (client projects, not my own line).
  const recentWork = sortProjects(getPublicProjects(), 'created')
    .filter((p) => !projectsPreview.some((pp) => pp.id === p.id))
    .filter((p) => p.owner !== 'parker-industries-contract')
    .slice(0, 4)

  const latestArticles = getPublicArticles()
    .filter((a) => matchesTagExpression(a.tags ?? [], articlesFilter))
    .slice(0, 3)

  return (
    <PageContainer>
      <Head>
        <meta
          name="keywords"
          content="Mark Parker, Parker Programs, Parker Industries, developer, software engineer, engineer"
        ></meta>
        <meta name="og:title" content="Mark Parker"></meta>
        <meta name="og:image" content="https://markparker.me/mark-parker.jpg"></meta>
        <meta name="og:description" content={metaDescription}></meta>
        <meta name="description" content={metaDescription}></meta>
        <link rel="canonical" href="https://markparker.me" />
        <title>Mark Parker</title>
      </Head>

      {/* `xl:`, not `lg:` — the row needs the sidebar (26rem) + gap
          (2.5rem) + the full-width content column (42rem) + this
          container's own gutters to all fit side by side, ~75.5rem total
          (see PAGE_MAX_WIDTH in page-container.tsx). `lg:` switches to
          the row layout at 1024px, well before that — for roughly
          1024–1280px of viewport width the row was active but too narrow
          for its own content, clipping the fixed-width column. `xl:`
          (1280px) is the first standard breakpoint that actually clears
          the real minimum. */}
      <div className="mx-auto flex xl:flex-row flex-col">
        <div className="mt-5 xl:w-[26rem] xl:flex-shrink-0">
          <Profile
            sections={{
              'notes-section': notesPreview.length > 0,
              'projects-section': projectsPreview.length > 0,
            }}
          />
        </div>
        {/* Fixed width, not `flex-1` — a flex item filling "whatever's
            left" next to the sidebar comes out narrower than
            CONTENT_MAX_WIDTH_CLASS at any width this site actually
            renders at (the sidebar + gap already eat into the shared
            75rem page budget), so the cap never actually engaged; the
            column was still landing at ~39rem instead of 42rem. Fixed
            width (with flex-shrink-0, so the row can't compress it) plus
            PAGE_MAX_WIDTH bumped to fit both — see page-container.tsx —
            makes it the SAME 42rem content pages get, not just capped at
            it. */}
        <div className={`mt-10 xl:ml-10 xl:flex-shrink-0 ${CONTENT_MAX_WIDTH_CLASS}`}>
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
              <Reveal dataAlignHeading="posts" className="text-center font-sans mt-4 mb-10 block">
                <Link
                  style={2}
                  href={withParam('/notes', 'notes', notesFilter)}
                  className="text-xl font-semibold"
                >
                  All posts →
                </Link>
              </Reveal>
            </>
          )}

          {recentWork.length > 0 && (
            <>
              <SectionHeader
                id="recent-section"
                title="Recent Work"
                href="/projects?sort=created"
                subtitle="The newest things I've built."
                context="home.recent"
                divider
              />
              <RecentWorkList projects={recentWork} />
              <Reveal dataAlignHeading="recent" className="text-center font-sans mt-4 mb-10 block">
                <Link
                  style={2}
                  href="/projects?sort=created"
                  className="text-xl font-semibold"
                >
                  more →
                </Link>
              </Reveal>
            </>
          )}

          {projectsPreview.length > 0 && (
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
              <ProjectsList projects={projectsPreview} />
              <Reveal dataAlignHeading="projects" className="text-center font-sans mt-4 mb-10 block">
                <Link
                  style={2}
                  href={withParam('/projects', 'projects', projectsFilter)}
                  className="text-xl font-semibold"
                >
                  All projects →
                </Link>
                {/* These three are the most interesting, not the newest —
                    the newest work usually surfaces via the Blog section
                    above, but give recency its own escape hatch so the
                    project list doesn't feel frozen to a returning visitor. */}
                {/* data-scroll-top-after-transition: this link morphs like
                    any projects link, but then scrolls to the top of the
                    destination once the morph ends — its point is to reveal
                    the NEWEST projects, which sit at the top of the
                    created-sorted list (see _app.tsx). */}
                {/* "see the latest" hidden temporarily — the Recent Work
                    section above now covers recency.
                <span
                  className="block mt-1.5 text-sm text-muted-light dark:text-muted-dark"
                  data-scroll-top-after-transition
                >
                  Featured picks —{' '}
                  <Link style={1} href="/projects?sort=created">
                    see the latest →
                  </Link>
                </span> */}
              </Reveal>
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
          <Reveal dataAlignHeading="blog" className="text-center font-sans mt-4 block">
            <Link
              style={2}
              href={withParam('/blog', 'articles', articlesFilter)}
              className="text-xl font-semibold"
            >
              All posts →
            </Link>
          </Reveal>
        </div>
      </div>
    </PageContainer>
  )
}
