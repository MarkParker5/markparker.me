import NextLink, { LinkProps as NextLinkProps } from 'next/link'
import { MouseEventHandler, PropsWithChildren } from 'react'
export type LinkProps = PropsWithChildren<
  NextLinkProps & {
    style?: 1 | 2
    newTab?: boolean
    className?: string
    title?: string
    'aria-label'?: string
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
  delete passProps['aria-label']
  delete passProps.onClick

  const isExternalLink = props.href.toString().startsWith('http')

  // External links skip NextLink's client-side router entirely — there's
  // nothing for it to prefetch or shallow-route to on another domain, and
  // routing an absolute URL through it was previously silently a no-op (this
  // branch built the <a> below but never returned it, so it never actually
  // ran).
  if (isExternalLink) {
    return (
      <a
        className={className}
        title={props.title}
        aria-label={props['aria-label']}
        {...targetProps}
        href={props.href.toString()}
        onClick={props.onClick}
      >
        {props.children}
      </a>
    )
  }

  // Next 13+ Link renders its own <a>; forward the anchor props onto it
  // directly instead of nesting an <a> child (which now throws).
  return (
    <NextLink
      {...(passProps as NextLinkProps)}
      className={className}
      title={props.title}
      aria-label={props['aria-label']}
      {...targetProps}
      onClick={props.onClick}
    >
      {props.children}
    </NextLink>
  )
}
