import { ArticleLayout } from '../components/article-layout'
import { NotesList } from '../components/notes-list'
import { FilterBar } from '../components/filter-bar'
import { SectionHeader } from '../components/section-header'
import { PageMeta } from '../components/page-meta'
import { getPublicNotes } from '../note'
import { matchesTagExpression, useQueryParam } from '../filter'
import { NOTES_ACCOUNTS, NOTES_SUBTITLE } from '../socials'

export default function Notes() {
  const metaDescription = "Mark Parker's short-form posts — mirrored from X, Bluesky, Mastodon, and Telegram."
  const allNotes = getPublicNotes()
  const [filter] = useQueryParam('notes')
  const availableTags = Array.from(new Set(allNotes.flatMap((n) => n.tags ?? []))).sort()
  const filtered = allNotes.filter((n) => matchesTagExpression(n.tags ?? [], filter))

  return (
    <div>
      <ArticleLayout>
        <PageMeta title="Mark Parker — Posts" description={metaDescription} path="/notes" />
        <SectionHeader
          title="Posts"
          subtitle={NOTES_SUBTITLE}
          icons={NOTES_ACCOUNTS}
          context="notes-page"
          hideTitleOption
        />
        <FilterBar paramName="notes" contentType="notes" availableTags={availableTags} />
        <NotesList notes={filtered} />
      </ArticleLayout>
    </div>
  )
}
