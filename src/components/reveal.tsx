import { CSSProperties, useEffect, useRef, useState, PropsWithChildren } from 'react'
import { viewTransitionState, onTransitionSettled, onBeforeCapture } from '../view-transition-state'

// True if `root` itself, or anything nested inside it, is actively
// morphing in the transition currently in flight — NOT just whether
// `root`'s own inline style happens to carry a name. Two things make this
// less trivial than it sounds:
//
// - Reveal is usually applied to a plain wrapper div (see SectionHeader,
//   ArticleLayout's header) with the actual named element — the h2, the
//   logo h1 — nested a level or two inside it. Checking only `root`'s own
//   style always came back empty for those wrappers, so this always
//   concluded "not morphing" even when the thing it wrapped WAS morphing —
//   hiding the wrapper (and the real morph target inside it) for the
//   entire transition, which is what made the morph itself go invisible.
// - Every note/article/project card carries its OWN individual
//   view-transition-name (see notes-list.tsx etc.) — not just the one
//   heading `alignedName` points at. Any number of them can be morphing at
//   once in a single transition (whichever ones ended up on-screen on both
//   the old and new page), not only the specific card that was clicked.
//   Comparing against `alignedName` alone treated every other on-screen
//   card as "not morphing" too, hiding its wrapper mid-flight — the
//   flicker/re-reveal and oversized-morph bugs both traced back to this.
//   disableOffscreenTransitionNames has already reset anything NOT
//   actively morphing to the literal string 'none' by the time this runs,
//   so simply "does it still have a real name at all" is the correct,
//   complete check — no need to separately track which name(s) that is.
function elementOrDescendantIsMorphing(root: HTMLElement): boolean {
  const descendants = Array.from(root.querySelectorAll<HTMLElement>('[style*="view-transition-name"]'))
  const named = root.matches('[style*="view-transition-name"]') ? [root, ...descendants] : descendants
  return named.some((node) => {
    const name = node.style.getPropertyValue('view-transition-name')
    return !!name && name !== 'none'
  })
}

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
  // 'pending' is only a brief placeholder for the render(s) before the
  // effect below has had a chance to run and decide which of two very
  // different elements this is:
  //
  // - The one thing THIS transition is actively morphing (or persistent
  //   exempt chrome) — it MUST be visible from its very first render, since
  //   it's part of the browser's own snapshot the instant the transition's
  //   DOM update finishes. Starting genuinely 'hidden' would freeze that
  //   invisible state into the snapshot for the whole transition, then pop
  //   in with no animation once it tears down.
  // - Everything else — this should NOT be part of that snapshot at all.
  //   The effect below corrects this to a real 'hidden' as its very first
  //   action, before anything else runs, so in practice it's hidden for
  //   the entire transition and only reveals once the transition has
  //   genuinely finished (onTransitionSettled) — cascading in right as the
  //   morph ends, rather than sitting fully visible throughout it or
  //   popping in mid-flight.
  const [state, setState] = useState<'hidden' | 'shown' | 'instant' | 'pending'>(
    mountedDuringTransition.current ? 'pending' : 'hidden',
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
    let unsubscribeSettled: (() => void) | null = null
    let unsubscribeCapture: (() => void) | null = null

    // Fires a little before the block is fully in view, and only once —
    // this is an entrance, not a repeating scroll-linked effect. Shared by
    // every path below: the normal (no transition involved) case, and the
    // "still below the fold once the transition settled" case.
    function startObserving(target: T) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setState(viewTransitionState.active ? 'instant' : 'shown')
            observer.disconnect()
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
      )
      observer.observe(target)
      cleanupObserver = () => observer.disconnect()
    }

    if (mountedDuringTransition.current) {
      // Decides whether this element is part of the in-flight morph, and
      // therefore whether it must stay visible (it's in the browser's
      // snapshot) or should hide and cascade in after the transition.
      // Runs at _app.tsx's before-capture moment, NOT at effect-mount
      // time: only by then have the off-screen and unpaired
      // view-transition-names been stripped (handleDone), so "does
      // anything in here still carry a real name" is finally a truthful
      // proxy for "is this participating in the morph." At effect-mount
      // time that same check raced Next's routeChangeComplete handling and
      // could see the pre-strip names, wrongly counting half the page as
      // morphing. (_app.tsx wraps the notification in flushSync, so the
      // setState('hidden') below is committed to the DOM before the
      // browser captures the new page's snapshot.)
      const viaSubscription = !viewTransitionState.captureDone
      const decide = () => {
        const isMorphing = elementOrDescendantIsMorphing(el)
        if (process.env.NODE_ENV === 'development') {
          const ownName = el.style.getPropertyValue('view-transition-name')
          const descendantNames = Array.from(el.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')).map(
            (n) => n.style.getPropertyValue('view-transition-name'),
          )
          console.log('[reveal] decide', {
            el: el.tagName + (el.id ? `#${el.id}` : '') + (ownName ? `[name=${ownName}]` : ''),
            descendantNames,
            isMorphing,
            viaSubscription,
          })
        }
        if (isMorphing) {
          // Genuinely morphing — visible from its first render (it already
          // is, via 'pending'), then a deferred sanity check: if the
          // alignment scroll actually left it off-screen, quietly demote
          // to a real 'hidden' (nothing visible changes) so it reveals
          // properly when scrolled to later.
          let raf2 = 0
          const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
              const rect = el.getBoundingClientRect()
              const inView = rect.bottom > 0 && rect.top < window.innerHeight
              if (inView) {
                setState('instant')
              } else {
                setState('hidden')
                startObserving(el)
              }
            })
          })
          cleanupRaf = () => {
            cancelAnimationFrame(raf1)
            if (raf2) cancelAnimationFrame(raf2)
          }
        } else {
          // Not part of the morph — hide before the snapshot is captured,
          // so the transition plays without it, then decide at the
          // transition's true end (onTransitionSettled): reveal instantly
          // if it's already sitting on screen by then (the "everything
          // visible must reveal" safety net — no further scroll is coming
          // to trigger it), or arm the normal scroll observer if it's
          // below the fold.
          setState('hidden')
          const onSettled = () => {
            const rect = el.getBoundingClientRect()
            const inView = rect.bottom > 0 && rect.top < window.innerHeight
            if (inView) {
              setState('shown')
            } else {
              startObserving(el)
            }
          }
          if (viewTransitionState.settled) onSettled()
          else unsubscribeSettled = onTransitionSettled(onSettled)
        }
      }

      if (viewTransitionState.captureDone) decide()
      else unsubscribeCapture = onBeforeCapture(decide)
    } else {
      startObserving(el)
    }

    return () => {
      cleanupObserver?.()
      cleanupRaf?.()
      unsubscribeSettled?.()
      unsubscribeCapture?.()
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
  const className =
    state === 'hidden'
      ? 'transition-all duration-700 ease-out opacity-0 translate-y-8'
      : state === 'shown'
        ? 'transition-all duration-700 ease-out opacity-100'
        : 'opacity-100' // instant AND pending — both fully visible, nothing to animate

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
