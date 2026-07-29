import { GetStaticProps } from 'next'
import fs from 'fs'
import { getPublicArticles } from '../article'
import { getPublicProjects, getHomepageProjects, formatProjectDate } from '../project'

// Build-time-generated static file, following the same pattern as
// sitemap.gen.tsx/feed.gen.tsx (this repo is Pages Router + `next export`,
// so there's no App Router route handler available like on the Parker
// Industries site — a getStaticProps page that writes to public/ is the
// direct equivalent here).
const LlmsTxt = () => {
  return null
}

export const getStaticProps: GetStaticProps = async () => {
  const projects = getPublicProjects()
  // The "Flagship" section is the same top-by-interest set the homepage
  // shows, now that the hand-maintained `spotlight` flag is gone.
  const flagship = getHomepageProjects()
  const articles = getPublicArticles().filter((a) => !a.hidden && !a.origin)

  const projectLines = projects
    .map((p) => {
      const link = p.links[0] ? ` (${p.links[0].href})` : ''
      return `- **${p.title}**${link}: ${p.blurb} [${formatProjectDate(p)}, ${p.status}]`
    })
    .join('\n')

  const articleLines = articles
    .map((a) => `- **${a.title}** (${a.date_pretty}): ${a.description}`)
    .join('\n')

  const content = `# Mark Parker

> Engineer, co-founder of Parker Industries. Building MajorDom (private smart home) and STARK (offline voice platform). This page is the personal, historical record — for the company and its services, see parker-industries.org.

## About

Mark Parker is a full-stack software and hardware engineer based in Germany, working across embedded systems, backend, mobile, and voice interfaces. Co-founder of Parker Industries (parker-industries.org), a product-and-services company. Personal site: markparker.me.

## Flagship projects

${flagship.map((p) => `- **${p.title}** (${p.links[0]?.href ?? ''}): ${p.blurb}`).join('\n')}

## All projects (shipped, hobby, and dead — a full honest track record)

${projectLines}

## Articles (blog)

${articleLines}

## Posts

Short-form posts, cross-posted from X, Bluesky, Mastodon, and Telegram, are collected at markparker.me/notes with an RSS feed at markparker.me/notes-feed.xml. Not included in full here — check that page for current content.

## Pages

- / — profile, latest posts/projects/articles
- /projects — the full project list, filterable by tag
- /notes — short-form notes feed
- /blog — full article list, searchable
- /blog/[slug] — individual articles
- parker-industries.org — the company: services, portfolio, contract work
`

  const path = `${process.cwd()}/public/llms.txt`
  fs.writeFileSync(path, content, 'utf8')
  console.log('generated llms.txt')

  return {
    props: {},
  }
}

export default LlmsTxt
