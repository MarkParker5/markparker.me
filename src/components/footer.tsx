import { Link } from './link'
import { PageContainer } from './page-container'

export const Footer = () => (
  <footer className="mt-24 border-t">
    <PageContainer>
      <div className="py-10 flex flex-col sm:flex-row justify-between items-center gap-4 font-serif text-sm">
        {/* Muted as a solid color, not opacity on the row — opacity would
            also dim the nav Links below their own link-color contrast. */}
        <div className="text-muted-light dark:text-muted-dark">© {new Date().getFullYear()} Mark Parker</div>
        <div className="flex gap-4">
          <Link style={1} href="/projects">
            Projects
          </Link>
          <Link style={1} href="/notes">
            Posts
          </Link>
          <Link style={1} href="/blog">
            Blog
          </Link>
          <Link style={1} href="https://parker-industries.org" newTab>
            Parker Industries
          </Link>
        </div>
      </div>
    </PageContainer>
  </footer>
)
