import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { PropsWithChildren } from 'react'
export type LinkProps = PropsWithChildren<
  NextLinkProps & {
    style?: 1 | 2
    newTab?: boolean
  }
>
export function Link(props: LinkProps) {
  const className = (() => {
    switch (props.style) {
      case 1:
        return 'text-link1 hover:text-link1hover underline hover:no-underline'
      case 2:
        return 'text-link2-light hover:text-link2hover-light dark:text-link2-dark dark:hover:text-link2hover-dark font-semibold'
      case undefined:
        return ''
    }
  })()

  const targetProps: { [key: string]: string } = props.newTab
    ? { target: '_blank', rel: 'noreferrer noopener' }
    : {}

  const passProps = { ...props }
  delete passProps.newTab
  delete passProps.style

  const isExternalLink = props.href.toString().startsWith('http')

  if (isExternalLink) {
    ;<a className={className} {...targetProps} href={props.href.toString()}>
      {props.children}
    </a>
  }

  return (
    <NextLink {...(passProps as NextLinkProps)}>
      <a className={className} {...targetProps}>
        {props.children}
      </a>
    </NextLink>
  )
}
