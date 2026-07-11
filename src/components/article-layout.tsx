import { Link } from './link'
import { Separator } from './separator'
import { PropsWithChildren } from 'react'
import { PageContainer } from './page-container'
import { useDesignToggles } from '../design-toggles'

export const ArticleLayout = (props: PropsWithChildren<unknown>) => {
  const { headerDivider } = useDesignToggles()

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <header>
          <Link href="/">
            <h1 className="text-center block mt-4 mb-1 text-4xl">Mark Parker</h1>
          </Link>
          <div className="text-center">
            <Link style={1} href="/">
              About
            </Link>
            {' · '}
            <Link style={1} href="/projects">
              Projects
            </Link>
            {' · '}
            <Link style={1} href="/notes">
              Posts
            </Link>
            {' · '}
            <Link style={1} href="/blog">
              Blog
            </Link>
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
