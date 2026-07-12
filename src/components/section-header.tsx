import { CSSProperties, ReactNode } from 'react'
import { Link } from './link'
import { Separator } from './separator'
import { SectionSocials, SocialIcon } from './section-socials'
import { useDesignToggles } from '../design-toggles'

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
  // Opt-in only — the homepage's own section headings never pass this, so
  // they always show regardless of the dev toggle (they're doing real
  // wayfinding work for a first-time visitor scanning the page). Only the
  // standalone /notes, /projects, /blog pages pass it.
  hideTitleOption?: boolean
}

// The one component for a content-type heading (Notes/Projects/Blog) — used
// identically on the homepage preview sections and on each full content
// page, so they can never visually drift apart. `href` links the title back
// to the content page (homepage only — the full page IS that destination,
// so it's omitted there). `divider` is homepage-only too: content pages
// don't want a rule directly under their own title. `extraLink` is a small
// text link shown next to the icon row, for accounts an icon alone can't
// explain (e.g. "Habr (RU)" — the only Russian-language mirror).
export const SectionHeader = ({
  id,
  title,
  href,
  titleExtra,
  subtitle,
  icons,
  extraLink,
  context,
  divider,
  hideTitleOption,
}: Props) => {
  const { hidePageTitle } = useDesignToggles()
  const showTitle = !(hideTitleOption && hidePageTitle)

  return (
    <div id={id} className="text-center w-full scroll-mt-10 mb-6">
      {showTitle && (
        // A real heading, not a styled <p> — visually identical, but before
        // this a screen-reader's heading-navigation had nothing to land on
        // for "Posts"/"Projects"/"Blog", exactly the sections the homepage's
        // own jump-links (Profile's sectionNav) point at.
        //
        // `viewTransitionName` is keyed on the title, not on `id` — the
        // homepage preview and the full page both render a SectionHeader
        // for the same content type with the same title text, and it's
        // exactly that pair (only ever one on-screen at a time, since one
        // page unmounts before the other mounts) that the browser needs a
        // shared name for to morph one into the other on navigation.
        <h2
          className="text-4xl font-sans mb-2 inline-flex items-center gap-3"
          // Not yet in the CSSProperties type bundled with this React
          // version — cast rather than wait for @types/react to catch up.
          style={
            { viewTransitionName: `section-heading-${title.toLowerCase().replace(/\s+/g, '-')}` } as CSSProperties
          }
        >
          {href ? (
            <Link style={2} href={href} className="text-4xl">
              {title}
            </Link>
          ) : (
            title
          )}
          {titleExtra}
        </h2>
      )}
      {/* `muted`, a solid color (not opacity) — opacity here would also dim
          any link nested inside `subtitle` (e.g. the GitHub link), since
          child opacity can't undo a parent's compositing. */}
      <p className="font-sans text-base text-muted-light dark:text-muted-dark mb-3">{subtitle}</p>
      {((icons && icons.length > 0) || extraLink) && (
        <div className="flex justify-center items-center gap-4">
          {icons && icons.length > 0 && <SectionSocials icons={icons} context={context} />}
          {extraLink}
        </div>
      )}
      {divider && <Separator />}
    </div>
  )
}
