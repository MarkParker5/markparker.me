import { Link } from './link'
import { ArticleMeta } from '../article'

type Props = {
  articles: ArticleMeta[]
}

export const ArticlesList = ({ articles }: Props) => (
  <div className="mx-auto font-serif">
    <ul>
      {articles.map((article) => (
        <li key={article.id} className="text-xl mb-8 list-none">
          {article.origin ? (
            <Link style={2} href={article.origin} newTab>{`${article.title}, ${
              new URL(article.origin).hostname
            }`}</Link>
          ) : (
            <Link style={2} href={`/blog/${article.id}`}>
              {article.title}
            </Link>
          )}
          <span className="block text-base italic opacity-50">— {article.date_pretty} · {article.read_time} read</span>
          <span className="block text-base">{article.description}</span>
        </li>
      ))}
    </ul>
  </div>
)
