import { useRouter } from 'next/router'
import { useCallback } from 'react'

// Tiny boolean tag-expression language: `|` (OR, lowest precedence),
// `&` (AND), `!` (NOT, prefix). No grouping/parens — not needed for the
// simple filters this powers. Tags must not contain & | ! characters.
export type TagPredicate = (tags: string[]) => boolean

export function parseTagExpression(expr: string): TagPredicate {
  const src = expr.trim()
  if (!src) return () => true

  let pos = 0

  function parseOr(): TagPredicate {
    let left = parseAnd()
    while (pos < src.length && src[pos] === '|') {
      pos++
      const right = parseAnd()
      const prev = left
      left = (tags) => prev(tags) || right(tags)
    }
    return left
  }

  function parseAnd(): TagPredicate {
    let left = parseUnary()
    while (pos < src.length && src[pos] === '&') {
      pos++
      const right = parseUnary()
      const prev = left
      left = (tags) => prev(tags) && right(tags)
    }
    return left
  }

  function parseUnary(): TagPredicate {
    if (src[pos] === '!') {
      pos++
      const inner = parseUnary()
      return (tags) => !inner(tags)
    }
    return parseTag()
  }

  function parseTag(): TagPredicate {
    const start = pos
    while (pos < src.length && !'&|!'.includes(src[pos])) pos++
    const tag = src.slice(start, pos).trim()
    return (tags) => tags.includes(tag)
  }

  return parseOr()
}

export function matchesTagExpression(tags: string[], expr: string | undefined): boolean {
  if (!expr) return true
  return parseTagExpression(expr)(tags)
}

// Sort param shape: a field name, optionally prefixed with `-` for descending.
export function applySort<T>(
  items: T[],
  sortParam: string | undefined,
  getters: Record<string, (item: T) => number | string>,
): T[] {
  if (!sortParam) return items
  const desc = sortParam.startsWith('-')
  const key = desc ? sortParam.slice(1) : sortParam
  const getter = getters[key]
  if (!getter) return items

  const sorted = [...items].sort((a, b) => {
    const av = getter(a)
    const bv = getter(b)
    if (av < bv) return -1
    if (av > bv) return 1
    return 0
  })
  return desc ? sorted.reverse() : sorted
}

// Read/write a single query param, shallow-routing so filter changes don't
// re-run getStaticProps or scroll the page. Works fine on `next export`
// pages: router.query is populated client-side from window.location.
export function useQueryParam(name: string): [string, (value: string) => void] {
  const router = useRouter()
  const raw = router.query[name]
  const value = Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''

  const setValue = useCallback(
    (next: string) => {
      const query = { ...router.query }
      if (next) query[name] = next
      else delete query[name]
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    },
    [router, name],
  )

  return [value, setValue]
}
