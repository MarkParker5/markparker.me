import { ArticleLayout } from '../components/article-layout'
import { PageMeta } from '../components/page-meta'
import { Link } from '../components/link'

// Previously there was no custom 404 at all — a bad/typo'd URL (an old
// bookmark, a mistyped blog slug) fell through to Next's bare default error
// page: no nav, no branding, no way back in without hitting the browser's
// back button.
export default function NotFound() {
  return (
    <div>
      <ArticleLayout>
        <PageMeta
          title="Mark Parker — Page not found"
          description="The page you're looking for doesn't exist."
          path="/404"
        />
        <div className="text-center py-10">
          <p className="text-5xl font-sans mb-4">404</p>
          <p className="text-l font-sans text-muted-light dark:text-muted-dark mb-8">
            That page doesn't exist — it may have moved, or the link's just wrong.
          </p>
          <p className="font-sans">
            <Link style={2} href="/" className="text-xl font-semibold">
              Back to the homepage →
            </Link>
          </p>
        </div>
      </ArticleLayout>
    </div>
  )
}
