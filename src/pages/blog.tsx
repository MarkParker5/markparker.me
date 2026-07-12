import { ArticleLayout } from '../components/article-layout'
import { ArticlesList } from '../components/articles-list'
import { ArticleSearch, useArticleSearch } from '../components/article-search'
import { FilterBar } from '../components/filter-bar'
import { SectionHeader } from '../components/section-header'
import { PageMeta } from '../components/page-meta'
import { getPublicArticles } from '../article'
import { matchesTagExpression, useQueryParam } from '../filter'
import { BLOG_ACCOUNTS, BLOG_SUBTITLE, BLOG_EXTRA_LINK } from '../socials'

export default function Blog() {
  const metaDescription =
    "Mark Parker's longform articles — engineering write-ups, project retrospectives, and tutorials, mirrored to Medium, Hashnode, and Dev.to."
  const allArticles = getPublicArticles()
  const [searched, query, setQuery] = useArticleSearch(allArticles)
  const [tagFilter] = useQueryParam('articles')
  const availableTags = Array.from(new Set(allArticles.flatMap((a) => a.tags ?? []))).sort()
  const filtered = searched.filter((a) => matchesTagExpression(a.tags ?? [], tagFilter))

  return (
    <div>
      <ArticleLayout>
        <PageMeta title="Mark Parker — Blog" description={metaDescription} path="/blog" />
        <SectionHeader
          title="Blog"
          subtitle={BLOG_SUBTITLE}
          icons={BLOG_ACCOUNTS}
          extraLink={BLOG_EXTRA_LINK}
          context="blog-page"
          hideTitleOption
        />
        <ArticleSearch value={query} onChange={setQuery} />
        <FilterBar paramName="articles" contentType="articles" availableTags={availableTags} />
        <ArticlesList articles={filtered} />
      </ArticleLayout>
    </div>
  )
}
