import { Feed } from 'feed'
import { GetStaticProps } from 'next'
import { getPublicNotes } from '../note'
import fs from 'fs'

// Separate feed from feed.gen.tsx on purpose: blog subscribers shouldn't
// suddenly get short-note noise injected into an RSS feed they subscribed
// to for longform articles.
const NotesFeedComponent = () => {
  return null
}

export const getStaticProps: GetStaticProps = async () => {
  const author = {
    name: 'Mark Parker',
    link: 'https://markparker.me',
  }

  const feed = new Feed({
    title: 'Mark Parker — Notes',
    description: "Mark Parker's short-form notes",
    id: 'https://markparker.me/notes',
    link: 'https://markparker.me/notes',
    language: 'en',
    image: 'https://markparker.me/mark-parker.jpg',
    favicon: 'https://markparker.me/favicon.png',
    copyright: 'All rights reserved 2026, Mark Parker',
    updated: new Date(),
    generator: '---',
    feedLinks: {
      atom: 'https://markparker.me/notes-feed.xml',
    },
    author,
  })

  const notes = getPublicNotes()

  for (const note of notes) {
    feed.addItem({
      title: note.body.slice(0, 80),
      id: `https://markparker.me/notes#${note.id}`,
      link: `https://markparker.me/notes#${note.id}`,
      description: note.body,
      date: new Date(note.date),
      author: [author],
    })
  }

  const path = `${process.cwd()}/public/notes-feed.xml`
  fs.writeFileSync(path, feed.atom1(), 'utf8')
  console.log('generated notes-feed.xml')

  return {
    props: {},
  }
}

export default NotesFeedComponent
