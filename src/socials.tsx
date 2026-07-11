import { PLATFORM_META } from './note'
import { SocialIcon } from './components/section-socials'
import { Link } from './components/link'
import { trackOutboundClick } from './analytics'

// Real account URLs — the canonical ones, matching what's cross-posted.
export const NOTES_ACCOUNTS: SocialIcon[] = [
  { href: 'https://twitter.com/MarkParker_5', title: PLATFORM_META.twitter.label, icon: PLATFORM_META.twitter.icon },
  {
    href: 'https://bsky.app/profile/markparker5.bsky.social',
    title: PLATFORM_META.bluesky.label,
    icon: PLATFORM_META.bluesky.icon,
  },
  { href: 'https://t.me/parker_is_typing', title: PLATFORM_META.telegram.label, icon: PLATFORM_META.telegram.icon },
  {
    href: 'https://www.threads.net/@markparker_5',
    title: PLATFORM_META.threads.label,
    icon: PLATFORM_META.threads.icon,
  },
  { href: '/notes-feed.xml', title: 'RSS', icon: 'fa-sharp fa-solid fa-square-rss', newTab: false },
]
export const NOTES_SUBTITLE = 'Short-format thoughts and news — stay updated on your favorite platform.'

export const BLOG_ACCOUNTS: SocialIcon[] = [
  { href: '/feed.xml', title: 'RSS', icon: 'fa-sharp fa-solid fa-square-rss', newTab: false },
  { href: 'https://markparker5.medium.com', title: 'Medium', icon: 'fab fa-medium' },
  { href: 'https://markparker5.hashnode.dev/newsletter', title: 'Hashnode', icon: 'fab fa-hashnode' },
  { href: 'https://dev.to/markparker5', title: 'Dev.to', icon: 'fab fa-dev' },
]
export const BLOG_SUBTITLE = 'Longform articles — mirrored to every platform below, or read straight from RSS.'

// Habr is the odd one out: no icon reads as clearly recognizable as the
// brand ones above, and — more importantly — it's the only Russian-language
// mirror, which is worth saying in words rather than hiding behind a glyph.
export const BLOG_EXTRA_LINK = (
  <Link
    style={1}
    href="https://habr.com/users/MarkParker5/posts/"
    newTab
    className="text-base"
    onClick={() => trackOutboundClick('habr', 'blog-extra')}
  >
    Habr (RU)
  </Link>
)

// Projects has no separate icon strip — a lone icon in that row read as an
// orphaned footnote, not a CTA. Instead: small marks inline with the
// "Projects" title (GitHub + RSS, both linked), and "GitHub" as a real link
// inside the subtitle sentence too — a full-sentence click target is more
// discoverable than a single tiny icon.
export const PROJECTS_TITLE_ICON = (
  <span className="inline-flex items-center gap-3">
    <a
      href="https://github.com/MarkParker5"
      target="_blank"
      rel="noreferrer"
      title="GitHub"
      onClick={() => trackOutboundClick('github', 'projects-title')}
      className="opacity-80 hover:opacity-100 duration-150"
    >
      <i className="fab fa-github text-3xl align-middle" />
    </a>
    <a
      href="/projects-feed.xml"
      title="RSS"
      onClick={() => trackOutboundClick('rss', 'projects-title')}
      className="opacity-80 hover:opacity-100 duration-150"
    >
      <i className="fa-sharp fa-solid fa-square-rss text-3xl align-middle" />
    </a>
  </span>
)

export const PROJECTS_SUBTITLE = (
  <>
    Everything I’ve shipped, tinkered with, or killed — personal projects are mostly open source on{' '}
    <Link
      style={2}
      href="https://github.com/MarkParker5"
      newTab
      onClick={() => trackOutboundClick('github', 'projects-subtitle')}
    >
      GitHub
    </Link>
    , contract work links out to whatever’s public.
  </>
)
