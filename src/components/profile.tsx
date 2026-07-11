import { Link } from './link'
import { trackOutboundClick } from '../analytics'
import { ObfuscatedMailLink } from './obfuscated-email'

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

export function Profile() {
  return (
    <div className="text-center">
      <div className="font-serif">
        <img className="mx-auto h-36 w-36 rounded-full" src="/mark-parker.jpg" />
        <h1 className="mt-7 mb-1 text-4xl leading-tight">Mark Parker</h1>
        <p className="text-l mb-1 whitespace-nowrap">
          Engineer, co-founder of{' '}
          <Link style={2} href="https://parker-industries.org" newTab>
            Parker Industries
          </Link>
        </p>
        {/* Business-card audience's top next-click: the company, before
            anything personal — styled as a real CTA, not a footnote. */}
        <p className="mt-4 mb-6">
          <a
            href="https://parker-industries.org"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackOutboundClick('parker industries', 'profile-cta')}
            className="text-sm font-semibold border rounded-full py-1.5 px-4 inline-block
                       hover:bg-back-light hover:text-back-dark duration-200"
          >
            Work with my team →
          </a>
        </p>
      </div>

      <hr className="my-6 border-t opacity-30" />

      <LinksList />

      <hr className="my-6 border-t opacity-30" />

      <ul className="list-none leading-none">
        {sectionNav.map((item) => (
          <li
            key={item.href}
            className="py-3 w-full border my-3 hover:bg-back-light hover:text-back-dark duration-300"
          >
            <a
              href={item.href}
              title={`Jump to ${item.title}`}
              className="flex flex-row items-center"
              onClick={() => trackOutboundClick(item.title.toLowerCase(), 'profile-nav')}
            >
              <i className={item.icon + ' my-3 ml-3 fa-xl'} />
              <div className="w-full font-serif">{item.title}</div>
              <div className="w-10 mx-2"></div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const listItemClass = 'py-3 w-full border my-3 hover:bg-back-light hover:text-back-dark duration-300'

function LinkItem({ href, title, icon }: LinkMeta) {
  return (
    <li className={listItemClass}>
      <a
        href={href}
        title={title}
        className="flex flex-row items-center"
        onClick={() => trackOutboundClick(title.toLowerCase(), 'profile')}
      >
        <i className={icon + ' my-3 ml-3 fa-xl'} />
        <div className="w-full font-serif">{title}</div>
        <div className="w-10 mx-2"></div>
      </a>
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
      <li className={listItemClass}>
        <ObfuscatedMailLink title="Email" className="flex flex-row items-center">
          <i className="fas fa-envelope my-3 ml-3 fa-xl" />
          <div className="w-full font-serif">Email</div>
          <div className="w-10 mx-2"></div>
        </ObfuscatedMailLink>
      </li>
      {links.slice(2).map((link) => (
        <LinkItem key={link.href} {...link} />
      ))}
    </ul>
  )
}
