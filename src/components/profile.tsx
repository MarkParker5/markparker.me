import { CSSProperties } from 'react'
import { Link } from './link'
import { trackOutboundClick } from '../analytics'
import { ObfuscatedMailLink } from './obfuscated-email'
import { Reveal, useReveal } from './reveal'

// Same name ArticleLayout's compact header gives its own "Mark Parker" —
// the browser morphs this hero title into (or out of) that header on any
// navigation between the homepage and a content page, instead of two
// unrelated instances of the same text just cross-fading past each other.
const SITE_TITLE_TRANSITION = { viewTransitionName: 'site-title' } as CSSProperties

type LinkMeta = {
  href: string
  title: string
  icon: string
}

const links: LinkMeta[] = [
  // {
  //     href: 'https://buymeacoffee.com/markparker5',
  //     title: 'Support my work | Buy Me a Coffee',
  //     icon: 'fas fa-coffee',
  // },
  // {
  //     href: 'https://patreon.com/markparker5',
  //     title: 'Support my work | Patreon',
  //     icon: 'fab fa-patreon',
  // },
  // GitHub, Twitter, and the Telegram Channel live under the Projects/Notes
  // section headings instead (see SectionSocials) — this list is general
  // contact, not every account.
  {
    href: 'https://linkedin.com/in/MarkParker5',
    title: 'LinkedIn',
    icon: 'fab fa-linkedin',
  },
  {
    href: 'https://t.me/markparker5',
    title: 'Telegram',
    icon: 'fab fa-telegram',
  },
  // Email is rendered separately below via ObfuscatedMailLink — never as a
  // plain `mailto:` href, so it doesn't sit in static HTML for scrapers.
  {
    href: 'https://instagram.com/markparker_5',
    title: 'Instagram',
    icon: 'fab fa-instagram',
  },
  // {
  //   href: 'https://markparker5.medium.com',
  //   title: 'Medium (Blog Mirror)',
  //   icon: 'fab fa-medium',
  // },
  // {
  //   href: 'https://markparker5.hashnode.dev/newsletter',
  //   title: 'Hashnode (Blog Mirror)',
  //   icon: 'fab fa-hashnode',
  // },
  // {
  //   href: 'https://dev.to/markparker5',
  //   title: 'Dev.To (Blog Mirror)',
  //   icon: 'fab fa-dev',
  // },
  // {
  //     href: 'https://youtube.com/@markparker5',
  //     title: 'YouTube',
  //     icon: 'fab fa-youtube',
  // },
  // {
  //     href: 'https://youtube.com/@markparker_5',
  //     title: 'YouTube (RU)',
  //     icon: 'fab fa-youtube',
  // },
]

const sectionNav = [
  { href: '#notes-section', title: 'Posts', icon: 'fas fa-comment-dots' },
  { href: '#projects-section', title: 'Projects', icon: 'fas fa-folder-open' },
  { href: '#blog-section', title: 'Blog', icon: 'fas fa-newspaper' },
]

// Applied directly to the `<li>` itself (border, background, everything) —
// not just to a wrapper around its inner content. Wrapping only the inner
// `<Link>` meant the border/background box appeared instantly and only the
// text/icon inside it faded in, which looked like the reveal wasn't really
// happening — the box is most of what's visible here.
function Divider() {
  const reveal = useReveal<HTMLHRElement>()
  return <hr ref={reveal.ref} className={`my-6 border-t opacity-30 ${reveal.className}`} />
}

export function Profile() {
  return (
    <div className="text-center">
      <div className="font-sans">
        <Reveal>
          <img className="mx-auto h-36 w-36 rounded-full" src="/mark-parker.jpg" />
        </Reveal>
        <Reveal style={SITE_TITLE_TRANSITION}>
          <h1 className="mt-7 mb-1 text-4xl leading-tight">Mark Parker</h1>
        </Reveal>
        <Reveal>
          <p className="text-l mb-1 whitespace-nowrap">
            Engineer, co-founder of{' '}
            <Link style={2} href="https://parker-industries.org" newTab>
              Parker Industries
            </Link>
          </p>
        </Reveal>
        {/* Business-card audience's top next-click: the company, before
            anything personal — styled as a real CTA, not a footnote. */}
        <Reveal className="mt-4 mb-6 block">
          <Link
            href="https://parker-industries.org"
            newTab
            onClick={() => trackOutboundClick('parker industries', 'profile-cta')}
            className="text-sm font-semibold border rounded-full py-1.5 px-4 inline-block
                       hover:bg-back-light hover:text-back-dark duration-200"
          >
            Work with my team →
          </Link>
        </Reveal>
      </div>

      <Divider />

      <LinksList />

      <Divider />

      <ul className="list-none leading-none">
        {sectionNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </ul>
    </div>
  )
}

const listItemClass = 'py-3 w-full border my-3 hover:bg-back-light hover:text-back-dark duration-300'

function NavItem({ href, title, icon }: { href: string; title: string; icon: string }) {
  const reveal = useReveal<HTMLLIElement>()
  return (
    <li ref={reveal.ref} className={`${listItemClass} ${reveal.className}`}>
      <Link
        href={href}
        title={`Jump to ${title}`}
        className="flex flex-row items-center"
        onClick={(e) => {
          trackOutboundClick(title.toLowerCase(), 'profile-nav')
          // Next's router does its own same-page hash navigation — an
          // instant jump via scrollIntoView(), not a smooth one — which
          // overrides the CSS `scroll-behavior: smooth` on <html> a plain
          // anchor click would otherwise get. Handling the scroll here
          // ourselves and preventing Next's default is what actually makes
          // it smooth.
          const id = href.replace('#', '')
          const target = document.getElementById(id)
          if (target) {
            e.preventDefault()
            target.scrollIntoView({ behavior: 'smooth' })
            history.pushState(null, '', href)
          }
        }}
      >
        <i className={icon + ' my-3 ml-3 fa-xl'} />
        <div className="w-full font-sans">{title}</div>
        <div className="w-10 mx-2"></div>
      </Link>
    </li>
  )
}

function LinkItem({ href, title, icon }: LinkMeta) {
  const reveal = useReveal<HTMLLIElement>()
  return (
    <li ref={reveal.ref} className={`${listItemClass} ${reveal.className}`}>
      <Link
        href={href}
        newTab
        title={title}
        className="flex flex-row items-center"
        onClick={() => trackOutboundClick(title.toLowerCase(), 'profile')}
      >
        <i className={icon + ' my-3 ml-3 fa-xl'} />
        <div className="w-full font-sans">{title}</div>
        <div className="w-10 mx-2"></div>
      </Link>
    </li>
  )
}

function EmailItem() {
  const reveal = useReveal<HTMLLIElement>()
  return (
    <li ref={reveal.ref} className={`${listItemClass} ${reveal.className}`}>
      <ObfuscatedMailLink title="Email" className="flex flex-row items-center">
        <i className="fas fa-envelope my-3 ml-3 fa-xl" />
        <div className="w-full font-sans">Email</div>
        <div className="w-10 mx-2"></div>
      </ObfuscatedMailLink>
    </li>
  )
}

function LinksList() {
  // LinkedIn, Telegram, [Email — special-cased, see ObfuscatedMailLink], Instagram
  return (
    <ul className="list-none leading-none">
      {links.slice(0, 2).map((link) => (
        <LinkItem key={link.href} {...link} />
      ))}
      <EmailItem />
      {links.slice(2).map((link) => (
        <LinkItem key={link.href} {...link} />
      ))}
    </ul>
  )
}
