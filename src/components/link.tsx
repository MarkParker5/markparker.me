import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { MouseEventHandler, PropsWithChildren } from 'react'
export type LinkProps = PropsWithChildren<
  NextLinkProps & {
    style?: 1 | 2
    newTab?: boolean
    className?: string
    title?: string
    onClick?: MouseEventHandler<HTMLAnchorElement>
  }
>
export function Link(props: LinkProps) {
  const styleClassName = (() => {
    switch (props.style) {
      case 1:
        return 'text-link1 hover:text-link1hover underline hover:no-underline'
      case 2:
        return 'text-link2-light hover:text-link2hover-light dark:text-link2-dark dark:hover:text-link2hover-dark font-semibold'
      case undefined:
        return ''
    }
  })()
  const className = [styleClassName, props.className].filter(Boolean).join(' ')

  const targetProps: { [key: string]: string } = props.newTab
    ? { target: '_blank', rel: 'noreferrer noopener' }
    : {}

  const passProps = { ...props }
  delete passProps.newTab
  delete passProps.style
  delete passProps.className
  delete passProps.title
  delete passProps.onClick

  const isExternalLink = props.href.toString().startsWith('http')

  if (isExternalLink) {
    ;<a className={className} {...targetProps} href={props.href.toString()}>
      {props.children}
    </a>
  }

  return (
    <NextLink {...(passProps as NextLinkProps)}>
      <a className={className} title={props.title} {...targetProps} onClick={props.onClick}>
        {props.children}
      </a>
    </NextLink>
  )
}
