import { useEffect, useRef, useState } from 'react'
import { useQueryParam } from '../filter'
import { trackFilterChange } from '../analytics'

type SortOption<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  paramName: string
  contentType: string
  availableTags: string[]
  // Optional — only /projects passes this. Renders a picker inline with the
  // search input rather than its own separate row, since it's a peer of
  // "what to show", not another filter.
  sort?: {
    param: string
    options: SortOption<T>[]
    defaultValue: T
  }
}

export const FilterBar = <T extends string>({ paramName, contentType, availableTags, sort }: Props<T>) => {
  const [expr, setExpr] = useQueryParam(paramName)
  const [revealed, setRevealed] = useState(false)
  // Search starts collapsed behind the magnifying-glass button — only a
  // bookmarked/shared filtered link (expr already set) opens it by default,
  // same rule the tag disclosure already uses below.
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [sortValueRaw, setSortValue] = useQueryParam(sort?.param ?? '__unused_sort')
  const sortValue = (sort && (sortValueRaw || sort.defaultValue)) as T | undefined
  // A shared/bookmarked filtered link should still show which tags are
  // active — only hide the row when nothing's filtering yet.
  const showTags = revealed || Boolean(expr)
  const showSearch = searchOpen || Boolean(expr)

  useEffect(() => {
    if (showSearch) inputRef.current?.focus()
  }, [showSearch])

  function apply(next: string) {
    setExpr(next)
    trackFilterChange(contentType, next)
  }

  function toggleTag(tag: string) {
    apply(expr === tag ? '' : tag)
  }

  if (availableTags.length === 0) return null

  return (
    <div className="mb-8 font-sans flex flex-col items-center gap-3">
      <div className="w-full flex justify-start gap-2">
        {showSearch ? (
          <input
            ref={inputRef}
            type="text"
            value={expr}
            onChange={(e) => apply(e.target.value)}
            onBlur={() => {
              if (!expr) setSearchOpen(false)
            }}
            placeholder="Search, e.g. hardware&!archived"
            className="flex-1 min-w-0 rounded-lg border bg-back-secondary-light dark:bg-back-secondary-dark
                       py-2.5 px-4 text-sm font-mono outline-none focus:ring-2 focus:ring-link2-light
                       dark:focus:ring-link2-dark transition"
          />
        ) : (
          // No background/border here — a plain icon button, same visual
          // weight as the tag-disclosure toggle below it, not another boxed
          // control competing with the sort dropdown next to it.
          <button
            onClick={() => setSearchOpen(true)}
            title="Search"
            aria-label="Search"
            className="shrink-0 px-2 py-2.5 text-muted-light dark:text-muted-dark hover:text-primary-light
                       dark:hover:text-primary-dark duration-150"
          >
            <i className="fas fa-magnifying-glass text-lg" />
          </button>
        )}
        {sort && (
          <select
            value={sortValue}
            onChange={(e) => {
              const next = e.target.value
              setSortValue(next === sort.defaultValue ? '' : next)
              trackFilterChange(`${contentType}-sort`, next)
            }}
            className="shrink-0 rounded-lg border bg-back-secondary-light dark:bg-back-secondary-dark
                       py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-link2-light
                       dark:focus:ring-link2-dark transition"
          >
            {sort.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* A disclosure toggle, not a "Search" button — the input above
          already filters live on every keystroke, so a submit action
          would be a lie. This just shows/hides the tag chips. */}
      <button
        onClick={() => setRevealed((v) => !v)}
        className="text-sm text-muted-light dark:text-muted-dark hover:text-primary-light
                   dark:hover:text-primary-dark duration-150 flex items-center gap-1.5"
      >
        <i className={`fas fa-chevron-${showTags ? 'up' : 'down'} text-xs`} />
        {showTags ? 'Hide tags' : 'Filter by tag'}
      </button>

      {showTags && (
        <div className="flex flex-wrap justify-center gap-2">
          {availableTags.map((tag) => {
            const active = expr === tag
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-sm py-1.5 px-4 border rounded-full duration-150 ${
                  active
                    ? 'bg-primary-light text-back-light dark:bg-primary-dark dark:text-back-dark border-transparent'
                    : 'hover:bg-back-secondary-light dark:hover:bg-back-secondary-dark'
                }`}
              >
                {tag}
              </button>
            )
          })}
          {expr && (
            <button
              onClick={() => apply('')}
              className="text-sm py-1.5 px-4 rounded-full text-muted-light dark:text-muted-dark
                         hover:text-primary-light dark:hover:text-primary-dark duration-150"
            >
              ✕ reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}
