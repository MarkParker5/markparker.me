import Head from "next/head"
import { Link } from './link'


type LinkMeta = {
    href: string
    title: string
    icon: string
}

const links: LinkMeta[] = [
    {
        href: 'https://github.com/MarkParker5',
        title: 'GitHub',
        icon:'fab fa-github',
    },
    {
        href: 'https://twitter.com/MarkParker_5',
        title: 'Twitter',
        icon: 'fab fa-twitter',
    },
    {
        href: 'https://instagram.com/markparker_5',
        title: 'Instagram',
        icon: 'fab fa-instagram',
    },
    {
        href: 'https://t.me/parker_is_typing',
        title: 'Telegram Channel',
        icon: 'fab fa-telegram',
    },
    {
        href: 'https://t.me/parker_is_typing_chat',
        title: 'Telegram Chat',
        icon: 'fab fa-telegram',  
    },
    {
        href: 'https://youtube.com/@markparker5',
        title: 'YouTube',
        icon: 'fab fa-youtube',
    },
    {
        href: 'https://youtube.com/@markparker_5',
        title: 'YouTube (RU)',
        icon: 'fab fa-youtube',
    },
    {
        href: 'mailto:mark@parker-programs.com',
        title: 'Email',
        icon: 'fas fa-envelope',
    },
    {
        href: 'https://habr.com/users/MarkParker5/posts/',
        title: 'Habr (статьи на русском)',
        icon: 'fas fa-comment',
    },
]

export function Profile() {
  const metaDescription = 'Mark Parker — Just an engineer'

  return (
    <div className="text-center">
        <Head>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"/>
        </Head>
        <div className="font-serif">
            <img className="mx-auto h-36 w-36 rounded-full" src="/mark-parker.jpg" />
            <h1 className="mt-6 text-4xl leading-tight">Mark Parker</h1>
            <p className="text-l mb-5">
                Just an engineer | Making <Link style={2} href="https://majordom.io">MajorDom</Link> 
            </p>
        </div>
        <LinksList />
    </div>
  )
}

function LinksList() {
    return (
        <ul className="list-none leading-none">
        {links.map((link) => (
            <li key={link.href} className="w-full border my-3 hover:bg-back-light hover:text-back-dark duration-300">
                <a href={link.href} title={link.title} className="flex flex-row items-center">
                    <i className={link.icon + " w-8 h-8 my-2 ml-2 fa-2x"}/>
                    <div className="w-full">
                        {link.title}
                    </div>
                    <div className="w-10 mx-2"></div>
                </a>
            </li>
        ))}
        </ul>
    )
}