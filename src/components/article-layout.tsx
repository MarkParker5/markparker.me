import { Link } from './link'
import { Separator } from './separator'
import { PropsWithChildren } from 'react'

export const ArticleLayout = (props: PropsWithChildren<unknown>) => (
  <div className="mx-auto" style={{ maxWidth: '90%', width: '44rem' }}>
    <header>
      <Link href="/">
        <h1 className="text-center block mt-4 mb-1 text-4xl">Mark Parker</h1>
      </Link>
      <div className="text-center">
        <Link style={1} href="/">
          About
        </Link>
        {' · '}
        <Link style={1} href="/blog">
          Blog
        </Link>
      </div>
    </header>

    <Separator />

    <main>{props.children}</main>
  </div>
)
