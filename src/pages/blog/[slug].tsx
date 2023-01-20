import { GetStaticProps } from 'next'
import path from 'path'
import { ArticleMeta, getAllArticles, renderArticle } from '../../article'
import fs from 'fs/promises'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

type PostProps = {
  article: ArticleMeta
  mdxBody: MDXRemoteSerializeResult
}

export default function ({ article, mdxBody }: PostProps) {
  return renderArticle(article.id, () => <MDXRemote {...mdxBody} />)
}

export const getStaticProps: GetStaticProps<PostProps> = async (ctx) => {
  const articleId = ctx.params!.slug as string
  const article = getAllArticles().find((a) => a.id === articleId)!

  const articleFileContent = await fs.readFile(
    path.join(process.cwd(), `articles/${article.id}.mdx`),
    'utf8',
  )
  return {
    props: {
      article,
      mdxBody: await serialize(articleFileContent),
    },
  }
}

export async function getStaticPaths() {
  const articles = getAllArticles()

  return {
    paths: articles
      .filter((article) => !article.origin)
      .map((article) => ({
        params: {
          slug: article.id,
        },
      })),
    fallback: false,
  }
}
