// Pure, no Date.now()/`new Date()` default so it stays testable — pass `now`
// explicitly, or let callers default it themselves at the call site.
export function relativeTime(isoDate: string, now: Date): string | null {
  const then = new Date(isoDate)
  const diffMs = now.getTime() - then.getTime()
  if (diffMs < 0) return null // future-dated (clock skew, scheduled post) — just show the absolute date

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  if (diffDay < 30) return 'last week'
  if (diffDay < 60) return 'last month'
  if (diffDay < 335) return `${Math.round(diffDay / 30)} months ago`
  if (diffDay < 380) return '1 year ago'
  return null // more than a year — caller falls back to the absolute date
}
