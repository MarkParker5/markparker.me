import { Link } from './link'
import { ArticleMeta } from '../article'

type Props = {
  articles: ArticleMeta[]
}

export const ArticleList = ({ articles }: Props) => (
  <div className="mx-auto">
    <ul>
      {articles.map((article) => (
        <li key={article.id} className="text-xl mb-8 list-square">
          {article.origin ? (
            <Link style={2} href={article.origin} newTab>{`${article.title}, ${
              new URL(article.origin).hostname
            }`}</Link>
          ) : (
            <Link style={2} href={`/blog/${article.id}`}>
              {article.title}
            </Link>
          )}
          <span className="text-sm">
            <span> — </span>
            {article.date}
          </span>
          <span className="block text-sm whitespace-pre-line">{article.description}</span>
        </li>
      ))}
    </ul>
  </div>
)
