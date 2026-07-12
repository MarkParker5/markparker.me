import Head from 'next/head'

const SITE_URL = 'https://markparker.me'
const DEFAULT_OG_IMAGE = `${SITE_URL}/mark-parker.jpg`

type Props = {
  title: string
  description: string
  // Site-relative, e.g. '/notes' — used to build both the canonical URL and
  // the og:url tag, so a shared link always resolves back to the one true
  // address for that page instead of an arbitrary query-stringed variant.
  path: string
  ogImage?: string
}

// One place for the meta tags every real page needs — title, description,
// OG title/description/image/url, canonical. Before this, /blog only set a
// bare <title> (no description, no OG tags at all), and no page set a
// canonical URL, so a filtered/sorted link (e.g. /projects?sort=recent)
// could get indexed as if it were a distinct page from the plain one.
export function PageMeta({ title, description, path, ogImage = DEFAULT_OG_IMAGE }: Props) {
  const url = `${SITE_URL}${path}`
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="og:title" content={title} />
      <meta name="og:description" content={description} />
      <meta name="og:image" content={ogImage} />
      <meta name="og:url" content={url} />
      <link rel="canonical" href={url} />
    </Head>
  )
}
