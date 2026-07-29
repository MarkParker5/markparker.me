import { CSSProperties } from 'react'
import { Link } from './link'
import { Separator } from './separator'
import { PropsWithChildren } from 'react'
import { useRouter } from 'next/router'
import { PageContainer, CONTENT_MAX_WIDTH_CLASS } from './page-container'
import { useDesignToggles } from '../design-toggles'
import { Reveal } from './reveal'

// Both are the exact same element on every page — naming them means the
// browser treats "Mark Parker" and the rule under it as one continuous
// thing across a navigation instead of cross-fading identical content for
// no reason (and it's the natural anchor for the "closest divider to the
// title should move too" ask, since this is literally that divider).
const SITE_TITLE_TRANSITION = { viewTransitionName: 'site-title' } as CSSProperties
const SITE_DIVIDER_TRANSITION = { viewTransitionName: 'site-title-divider' } as CSSProperties

const NAV_ITEMS = [
  { href: '/', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/notes', label: 'Posts' },
  { href: '/blog', label: 'Blog' },
]

export const ArticleLayout = (props: PropsWithChildren<unknown>) => {
  const { headerDivider } = useDesignToggles()
  const { pathname } = useRouter()

  return (
    <PageContainer>
      <div className={`mx-auto ${CONTENT_MAX_WIDTH_CLASS}`}>
        {/* Wrapped in <Reveal> again — useReveal itself now distinguishes
            "mounted while a View Transition is in flight" (skips straight to
            fully visible, no invisible frame for the transition's snapshot
            to freeze — see its 'pending' state) from a genuine fresh
            load/reload (plays the normal fade-up entrance, same as any
            other above-the-fold content). Un-wrapping this entirely to
            dodge the transition-snapshot bug also lost the entrance
            animation on a direct visit — the underlying bug is fixed at the
            source now, so there's no reason to special-case this element. */}
        <Reveal>
          <header>
            <Link href="/">
              <h1 className="text-center block mt-4 mb-1 text-4xl" style={SITE_TITLE_TRANSITION}>
                Mark Parker
              </h1>
            </Link>
            <div className="text-center">
              {NAV_ITEMS.map((item, i) => {
                // Blog articles live at /blog/[slug] — "Blog" should still
                // read as active there, not just on the /blog index itself.
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <span key={item.href}>
                    {i > 0 && ' · '}
                    {isActive ? (
                      <span className="font-semibold text-primary-light dark:text-primary-dark" aria-current="page">
                        {item.label}
                      </span>
                    ) : (
                      <Link style={1} href={item.href}>
                        {item.label}
                      </Link>
                    )}
                  </span>
                )
              })}
            </div>
          </header>
        </Reveal>

        {/* Whether the <hr> shows: everywhere, nowhere, or desktop-only.
            When it's absent, keep the same vertical gap it provided
            (my-10 / mt-10) so removing it doesn't also collapse the
            breathing room between the nav and the page title. For
            'desktop', both render but each is display-toggled at `md` so
            only one is ever laid out per viewport — safe to share the
            `site-title-divider` transition name, since a display:none
            element has no box to duplicate it. */}
        {headerDivider === 'shown' && <Separator style={SITE_DIVIDER_TRANSITION} />}
        {headerDivider === 'hidden' && <div className="mt-10" style={SITE_DIVIDER_TRANSITION} />}
        {headerDivider === 'desktop' && (
          <>
            <Separator className="hidden md:block" style={SITE_DIVIDER_TRANSITION} />
            <div className="mt-10 md:hidden" style={SITE_DIVIDER_TRANSITION} />
          </>
        )}

        <main>{props.children}</main>
      </div>
    </PageContainer>
  )
}
