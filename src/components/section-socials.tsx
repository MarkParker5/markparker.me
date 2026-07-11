import { trackOutboundClick } from '../analytics'

export type SocialIcon = {
  href: string
  title: string
  icon: string
  newTab?: boolean
}

type Props = {
  icons: SocialIcon[]
  context: string
  className?: string
}

// Icon-only row of accounts relevant to one content type (Notes/Blog/
// Projects) — placed under that section's own heading, distinct from the
// general Contacts list in the Profile sidebar. This is a CTA, not a
// footnote, so icons are sized to be clearly clickable, not decorative.
export const SectionSocials = ({ icons, context, className = '' }: Props) => (
  <div className={`flex justify-center gap-6 sm:gap-5 items-center ${className}`}>
    {icons.map((item) => (
      <a
        key={item.href}
        href={item.href}
        title={item.title}
        target={item.newTab === false ? undefined : '_blank'}
        rel="noreferrer"
        onClick={() => trackOutboundClick(item.title.toLowerCase(), context)}
        // Bigger tap target than the glyph itself (padding, not just a
        // bigger icon) — on mobile this is the row people actually use to
        // decide which platform to follow, not a decorative footer strip.
        className="p-1.5 -m-1.5 opacity-80 hover:opacity-100 duration-150"
      >
        <i className={`${item.icon} text-3xl sm:text-2xl`} />
      </a>
    ))}
  </div>
)
