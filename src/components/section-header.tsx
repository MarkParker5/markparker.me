import { ReactNode } from 'react'
import { Link } from './link'
import { Separator } from './separator'
import { SectionSocials, SocialIcon } from './section-socials'

type Props = {
  id?: string
  title: string
  href?: string
  titleExtra?: ReactNode
  subtitle: ReactNode
  icons?: SocialIcon[]
  extraLink?: ReactNode
  context: string
  divider?: boolean
}

// The one component for a content-type heading (Notes/Projects/Blog) — used
// identically on the homepage preview sections and on each full content
// page, so they can never visually drift apart. `href` links the title back
// to the content page (homepage only — the full page IS that destination,
// so it's omitted there). `divider` is homepage-only too: content pages
// don't want a rule directly under their own title. `extraLink` is a small
// text link shown next to the icon row, for accounts an icon alone can't
// explain (e.g. "Habr (RU)" — the only Russian-language mirror).
export const SectionHeader = ({ id, title, href, titleExtra, subtitle, icons, extraLink, context, divider }: Props) => (
  <div id={id} className="text-center w-full scroll-mt-10 mb-6">
    <p className="text-4xl font-serif mb-2 inline-flex items-center gap-3">
      {href ? (
        <Link style={2} href={href} className="text-4xl">
          {title}
        </Link>
      ) : (
        title
      )}
      {titleExtra}
    </p>
    {/* `muted`, a solid color (not opacity) — opacity here would also dim
        any link nested inside `subtitle` (e.g. the GitHub link), since
        child opacity can't undo a parent's compositing. */}
    <p className="font-serif text-base text-muted-light dark:text-muted-dark mb-3">{subtitle}</p>
    {((icons && icons.length > 0) || extraLink) && (
      <div className="flex justify-center items-center gap-4">
        {icons && icons.length > 0 && <SectionSocials icons={icons} context={context} />}
        {extraLink}
      </div>
    )}
    {divider && <Separator />}
  </div>
)
