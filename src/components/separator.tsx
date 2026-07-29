import { CSSProperties } from 'react'
import { useReveal } from './reveal'

// Fades in on scroll like everything else now — a divider that just
// snapped into place while the content around it faded read as an
// unfinished/disconnected piece of the page.
export function Separator({ style, className = '' }: { style?: CSSProperties; className?: string }) {
  const reveal = useReveal<HTMLHRElement>()
  return (
    <hr
      ref={reveal.ref}
      className={`mx-auto w-3/4 h-1px border-t-1 border-faded my-10 ${reveal.className} ${className}`}
      style={style}
    />
  )
}
