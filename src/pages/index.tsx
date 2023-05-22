import Head from 'next/head'
import { Separator } from '../components/separator'
import { Profile } from '../components/profile'
import { ArticlesList } from '../components/articles-list'
import { getPublicArticles } from '../article'

export default function Index() {
  const metaDescription = 'Mark Parker — Just an engineer'

  return (
    <div className="mx-auto" style={{ maxWidth: "90%" }}>
      <Head>
        <meta charSet="utf-8"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
        <meta
          name="keywords"
          content="Mark Parker, Parker Programs, Parker Industries, developer, software engineer, engineer"
        ></meta>
        <meta name="og:title" content="Mark Parker"></meta>
        <meta name="og:image" content="https://markparker.me/mark-parker.jpg"></meta>
        <meta name="og:description" content={metaDescription}></meta>
        <meta name="description" content={metaDescription}></meta>
        <title>Mark Parker</title>
      </Head>
    
      <div className="mx-auto flex lg:flex-row flex-col" style={{ maxWidth: "80rem"}}>
        <div className="mt-5 lg:w-1/3">
          <Profile/>
        </div>
        <div className="mt-10 lg:w-2/3">
          <div className="text-center w-full">
            <p className="text-4xl font-serif">
              Blog
            </p>
            <Separator />
          </div>
          <ArticlesList articles={getPublicArticles()} />
        </div>
      </div>

    </div>
  )
}
