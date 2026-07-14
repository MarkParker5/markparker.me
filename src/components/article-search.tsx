import { useEffect, useRef, useState } from 'react'
import { useQueryParam } from '../filter'
import { ArticleMeta } from '../article'
import { useReveal } from './reveal'

export function useArticleSearch(articles: ArticleMeta[]): [ArticleMeta[], string, (v: string) => void] {
  const [query, setQuery] = useQueryParam('q')
  const needle = query.trim().toLowerCase()

  if (!needle) return [articles, query, setQuery]

  const filtered = articles.filter((a) => {
    const haystack = [a.title, a.description, ...a.keywords].join(' ').toLowerCase()
    return haystack.includes(needle)
  })

  return [filtered, query, setQuery]
}

type Props = {
  value: string
  onChange: (value: string) => void
}

// Starts collapsed behind a plain magnifying-glass button (no bg/border),
// same pattern as FilterBar's own search toggle — filtering is already live
// on every keystroke, so there's no submit action to expose, just a
// disclosure. A shared/bookmarked search link (value already set) opens it
// expanded by default.
export const ArticleSearch = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const showInput = open || Boolean(value)
  // Same entrance treatment FilterBar already gets on /notes and /projects
  // — without it this was the one piece of page chrome that just popped in
  // (or rode along inside a transition's cross-fade) instead of revealing.
  const reveal = useReveal<HTMLDivElement>()

  useEffect(() => {
    if (showInput) inputRef.current?.focus()
  }, [showInput])

  return (
    <div ref={reveal.ref} className={`flex justify-start gap-2 mb-4 ${reveal.className}`}>
      {showInput ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (!value) setOpen(false)
          }}
          placeholder="Search articles…"
          className="flex-1 min-w-0 rounded-lg border bg-back-secondary-light dark:bg-back-secondary-dark
                     py-2.5 px-4 font-sans outline-none focus:ring-2 focus:ring-link2-light
                     dark:focus:ring-link2-dark transition"
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Search articles"
          aria-label="Search articles"
          className="shrink-0 px-2 py-2.5 text-muted-light dark:text-muted-dark hover:text-primary-light
                     dark:hover:text-primary-dark duration-150"
        >
          <i className="fas fa-magnifying-glass text-lg" />
        </button>
      )}
    </div>
  )
}
