import { CSSProperties, useEffect, useRef, useState, PropsWithChildren } from 'react'
import { viewTransitionState } from '../view-transition-state'

// Fade + slide up as a block enters the viewport — the "sections arrive as
// you scroll" pattern (parker-industries.org uses the same idea). Plain
// IntersectionObserver + CSS transition, no new dependency (no
// framer-motion) — this site has stayed deliberately dependency-light, and
// a one-shot reveal doesn't need a physics engine.
//
// A hook, not just a wrapper component — spread `useReveal().props` onto
// whatever element actually needs to animate, including one that already
// has to be a specific tag (an `<li>` inside a `<ul>` can't have a `<div>`
// substituted in for it; an `<hr>` can't wrap children at all). Wrapping
// only a card's *inner content* in an extra div, with the border/background
// left on the untouched outer element, meant the border/background never
// moved — it just sat there instantly while the content faded in inside it,
// which reads as "the animation didn't really happen."
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [state, setState] = useState<'hidden' | 'shown' | 'instant'>('hidden')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect the user's OS-level motion preference — reveal immediately,
    // no fade/slide, rather than force motion on someone who's opted out.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('instant')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // A page that just arrived via a View Transition already has its
          // own arrival animation (the cross-fade/morph) — layering this
          // component's own fade-up on top of that at the same moment reads
          // as two animations fighting, not one. Anything already on
          // screen at that moment (checked exactly when it's first
          // observed, not just at mount) skips straight to its final state
          // instead. Content still below the fold hasn't intersected yet,
          // so by the time a real scroll brings it into view the
          // transition has long finished and it reveals normally — no
          // separate "above/below the fold" bookkeeping needed, this falls
          // out of IntersectionObserver's own timing for free.
          setState(viewTransitionState.active ? 'instant' : 'shown')
          observer.disconnect()
        }
      },
      // Fires a little before the block is fully in view, and only once —
      // this is an entrance, not a repeating scroll-linked effect.
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    )

    if (viewTransitionState.active) {
      // Mid-transition, _app.tsx's window.scrollTo(0, 0) is meant to have
      // already corrected the scroll position by the time this runs, but
      // that's a synchronous same-tick guarantee, not a same-frame one —
      // observing immediately risked this element's very first check still
      // seeing the outgoing page's leftover scroll offset, which could
      // mark far more cards "already on screen" than actually end up above
      // the fold once the scroll truly settles. Those extra ones would
      // then sit stuck in their final state and never animate when the
      // visitor scrolls down to them for real. A couple of frames' delay —
      // the same margin _app.tsx gives itself before clearing this same
      // flag — is enough for the corrected scroll position to be what this
      // observer's first real check sees.
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => observer.observe(el))
      })
      return () => {
        cancelAnimationFrame(raf1)
        if (raf2) cancelAnimationFrame(raf2)
        observer.disconnect()
      }
    }

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // `translate-y-0` (rather than no transform utility at all) still sets
  // `transform: translateY(0px)` — CSS transforms of any kind (including a
  // literal zero) create a new stacking context, which permanently traps
  // z-indexed descendants (e.g. a note's action popover) inside whichever
  // element reveals it. A *later* sibling — its own such stacking context —
  // would then paint over an *earlier* one's open popover, since z-10
  // inside one stacking context can't out-rank another stacking context's
  // paint order. Once shown, drop the transform utility entirely so the
  // box returns to `transform: none` and stops creating a stacking context
  // — only the pre-reveal state needs the offset to transition from.
  const className =
    state === 'hidden'
      ? 'transition-all duration-700 ease-out opacity-0 translate-y-8'
      : state === 'shown'
        ? 'transition-all duration-700 ease-out opacity-100'
        : 'opacity-100' // instant — no transition classes at all, nothing to animate

  return { ref, className }
}

export function Reveal({
  children,
  className = '',
  style,
}: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  const reveal = useReveal<HTMLDivElement>()
  return (
    <div ref={reveal.ref} className={`${reveal.className} ${className}`} style={style}>
      {children}
    </div>
  )
}
