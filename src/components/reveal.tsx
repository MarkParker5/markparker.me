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
  // Captured once, at mount — not re-read from viewTransitionState.active
  // later, since that flag flips back to false a couple of frames after
  // this same navigation (see _app.tsx) and this needs to remember what was
  // true specifically at the moment THIS element was born.
  const mountedDuringTransition = useRef(viewTransitionState.active)
  // A page arriving via a View Transition already has its own arrival
  // animation (the browser's native root cross-fade, plus each named
  // element's own morph) — content that's already on screen the moment
  // that plays doesn't need a SECOND entrance animation layered on top,
  // it should just be there. Only content that's genuinely below the fold
  // (not yet visible at all) still needs the normal scroll-triggered
  // reveal, exactly like a fresh page load.
  //
  // An earlier, much more complicated version of this tried to hide
  // non-morphing content for the transition's own duration and cascade it
  // in right as the transition settled — repeatedly broke in ways that
  // traced back to the same root problem: reliably synchronizing with the
  // exact moment the BROWSER (not React) captures its snapshot turned out
  // not to be solvable from React's side at all, no matter which effect
  // timing or imperative-DOM trick was tried. Letting the browser's own
  // cross-fade handle transition arrivals — the same thing it already
  // does for every un-special-cased element — sidesteps the problem
  // entirely instead of continuing to chase it.
  const [state, setState] = useState<'hidden' | 'shown' | 'instant'>(
    mountedDuringTransition.current ? 'instant' : 'hidden',
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect the user's OS-level motion preference — reveal immediately,
    // no fade/slide, rather than force motion on someone who's opted out.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('instant')
      return
    }

    let cleanupObserver: (() => void) | null = null
    let cleanupRaf: (() => void) | null = null

    // Fires a little before the block is fully in view, and only once —
    // this is an entrance, not a repeating scroll-linked effect. Shared by
    // every path below: the normal (no transition involved) case, and the
    // "genuinely below the fold on arrival" case.
    function startObserving(target: T) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setState('shown')
            observer.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
      )
      observer.observe(target)
      cleanupObserver = () => observer.disconnect()
    }

    if (mountedDuringTransition.current) {
      // _app.tsx's alignment scroll is meant to have already applied by
      // the time this runs, but that's a synchronous same-tick guarantee,
      // not a same-frame one — checking immediately risked reading the
      // outgoing page's leftover scroll position. A couple of frames'
      // delay is enough for the corrected position to be what this sees.
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect()
          // Only "below the viewport, not yet reached" counts as
          // genuinely ahead. Anything already on screen, OR already
          // scrolled PAST (rect.bottom <= 0, above the viewport) shows
          // immediately instead — scrolling back UP to revisit something
          // you've already passed shouldn't replay its entrance
          // animation, which a plain "is it in view right now" check
          // would otherwise trigger the next time it crosses back into
          // the viewport from below during that upward scroll.
          const genuinelyAhead = rect.top >= window.innerHeight
          if (genuinelyAhead) {
            setState('hidden')
            startObserving(el)
          } else {
            setState('instant')
          }
        })
      })
      cleanupRaf = () => {
        cancelAnimationFrame(raf1)
        if (raf2) cancelAnimationFrame(raf2)
      }
    } else {
      startObserving(el)
    }

    return () => {
      cleanupObserver?.()
      cleanupRaf?.()
    }
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
  //
  // Deliberately NOT on 'hidden' itself — only 'shown' carries
  // `transition-all`, so landing on 'hidden' (at mount, or when demoted
  // from 'instant' after the below-the-fold check above) is instant,
  // unanimated bookkeeping; only the actual reveal (hidden → shown) is
  // meant to be seen animating.
  const className =
    state === 'hidden'
      ? 'opacity-0 translate-y-8'
      : state === 'shown'
        ? 'transition-all duration-700 ease-out opacity-100'
        : 'opacity-100' // instant — fully visible, nothing to animate

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
