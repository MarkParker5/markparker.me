import { trackOutboundClick } from '../analytics'

// The address never appears as plain text or as a `mailto:` href in the
// server-rendered HTML — only these shifted char codes do — so a static
// scraper regexing page source for email addresses gets nothing; the real
// address is only assembled client-side, on click. This is deliberately not
// "real" encryption (the decode logic has to be public in the JS bundle for
// a real click to work, so there's no secret to protect) — the point is
// raising the bar above the cheap static-regex scrapers that do the bulk of
// scam-farm harvesting, not defeating a targeted attacker running a headless
// browser against this one page.
const SHIFT = 5
const CODES = [
  114, 102, 119, 112, 69, 117, 102, 119, 112, 106, 119, 50, 117, 119, 116, 108, 119, 102, 114, 120, 51, 104, 116, 114,
]

function decodeEmail(): string {
  return CODES.map((c) => String.fromCharCode(c - SHIFT)).join('')
}

type Props = {
  className?: string
  title?: string
  children: React.ReactNode
}

export function ObfuscatedMailLink({ className, title, children }: Props) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    trackOutboundClick('email', 'profile')
    window.location.href = `mailto:${decodeEmail()}`
  }

  return (
    <a href="#" title={title} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
