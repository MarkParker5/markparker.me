import { Link } from './link'
import { Separator } from './separator'
import { PropsWithChildren } from 'react'
import { useRouter } from 'next/router'
import { PageContainer } from './page-container'
import { useDesignToggles } from '../design-toggles'

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
      <div className="mx-auto max-w-2xl">
        <header>
          <Link href="/">
            <h1 className="text-center block mt-4 mb-1 text-4xl">Mark Parker</h1>
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

        {/* Without the rule, still keep the same vertical gap it used to
            provide (my-10) — otherwise removing it also collapses the
            breathing room between the nav and the page title, which isn't
            what this toggle is testing. */}
        {headerDivider ? <Separator /> : <div className="mt-10" />}

        <main>{props.children}</main>
      </div>
    </PageContainer>
  )
}
