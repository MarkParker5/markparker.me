import { useQueryParam } from '../filter'
import { ArticleMeta } from '../article'

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

// Filtering already happens live on every keystroke — the button (and
// Enter-to-submit) exist so there's a clear "done typing" action, not
// because submission triggers anything by itself.
export const ArticleSearch = ({ value, onChange }: Props) => (
  <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-4">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search articles…"
      className="w-full rounded-lg border bg-back-secondary-light dark:bg-back-secondary-dark
                 py-2.5 px-4 font-serif outline-none focus:ring-2 focus:ring-link2-light
                 dark:focus:ring-link2-dark transition"
    />
    <button
      type="submit"
      className="shrink-0 rounded-lg border py-2.5 px-4 font-serif text-sm font-semibold
                 hover:bg-back-light hover:text-back-dark duration-200"
    >
      Search
    </button>
  </form>
)
