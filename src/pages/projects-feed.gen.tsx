import { Feed } from 'feed'
import { GetStaticProps } from 'next'
import { getPublicProjects } from '../project'
import fs from 'fs'

// Separate feed again, same reasoning as notes-feed.gen.tsx: project
// updates are a different subscription interest than articles or notes.
const ProjectsFeedComponent = () => {
  return null
}

export const getStaticProps: GetStaticProps = async () => {
  const author = {
    name: 'Mark Parker',
    link: 'https://markparker.me',
  }

  const feed = new Feed({
    title: 'Mark Parker — Projects',
    description: 'Every project Mark Parker has built — shipped, hobby, and dead.',
    id: 'https://markparker.me/projects',
    link: 'https://markparker.me/projects',
    language: 'en',
    image: 'https://markparker.me/mark-parker.jpg',
    favicon: 'https://markparker.me/favicon.png',
    copyright: 'All rights reserved 2026, Mark Parker',
    updated: new Date(),
    generator: '---',
    feedLinks: {
      atom: 'https://markparker.me/projects-feed.xml',
    },
    author,
  })

  // ProjectMeta only carries a `year` (no exact date — most entries predate
  // this feed and were never meant to have one), so Jan 1 of that year is
  // used as a stand-in pubDate purely to give feed readers something to
  // sort by. It's a real limitation worth knowing about, not a precise
  // "shipped on this day" claim.
  const projects = [...getPublicProjects()].sort((a, b) => b.year - a.year)

  for (const project of projects) {
    const link = project.links[0]?.href ?? `https://markparker.me/projects#${project.id}`
    feed.addItem({
      title: project.title,
      id: `https://markparker.me/projects#${project.id}`,
      link,
      description: project.blurb,
      image: project.imageUrl ? `https://markparker.me${project.imageUrl}` : undefined,
      date: new Date(Date.UTC(project.year, 0, 1)),
      author: [author],
    })
  }

  const path = `${process.cwd()}/public/projects-feed.xml`
  fs.writeFileSync(path, feed.atom1(), 'utf8')
  console.log('generated projects-feed.xml')

  return {
    props: {},
  }
}

export default ProjectsFeedComponent
