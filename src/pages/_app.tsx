import { AppPropsType } from 'next/dist/shared/lib/utils'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import '../../styles/globals.css'
import { Footer } from '../components/footer'
import { DesignToggleProvider } from '../design-toggles'
import {
  viewTransitionState,
  disableOffscreenTransitionNames,
  captureClickAlignmentTarget,
  alignNewPageToTarget,
  findByTransitionName,
  ClickAlignmentTarget,
} from '../view-transition-state'

declare global {
  // it's important to have an interface here to append to the global type
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
  interface Document {
    // Not yet in the TS DOM lib bundled with this project — feature-detected
    // at every call site anyway (`document.startViewTransition?.(...)`), so
    // this is just enough typing to call it, not a claim it's always there.
    startViewTransition?: (callback: () => void | Promise<void>) => { finished: Promise<void> }
  }
}

if (process.env.NODE_ENV === 'development') {
  import('@impulse.dev/runtime')
    .then((impulse) => impulse.run())
    .catch((e) => {
      console.error('could not load impulse', e)
    })
}

// Wraps every route change in a View Transition — deliberately wired at the
// router-events level, not inside the shared `Link` component. Intercepting
// Link's own click handling (preventDefault + manual router.push) risks
// double-navigating or breaking cmd/ctrl-click-for-new-tab, since Next's
// Link already attaches its own click handling underneath; observing
// routeChangeStart/Complete instead means normal navigation is completely
// unmodified — this only ever *watches*, it never intercepts a click.
// Same mechanism covers both plain page-to-page transitions (the default
// cross-fade every browser gives you for free) and the "All <content> →"
// hero effect: SectionHeader tags its heading with a `view-transition-name`
// (see section-header.tsx) shared between the homepage preview and the full
// page, so the browser morphs that one element between them; everything
// else on the page just cross-fades, which is the native default for any
// element that isn't explicitly named.
function useViewTransitions() {
  const router = useRouter()
  const resolveRef = useRef<(() => void) | null>(null)
  // Set in handleStart, read in handleDone — an in-page hash jump (e.g. the
  // Profile section-nav / "Jump to Projects" links) fires the exact same
  // routeChangeStart/Complete events Next uses for a real page navigation,
  // even though the page itself never changes. Wrapping that in a View
  // Transition and forcing scrollTo(0, 0) below fought directly with the
  // smooth scrollIntoView those links do themselves — the scroll snapped
  // back to the top a moment after starting. Skipping both entirely for a
  // same-page hash change leaves the browser's native (CSS
  // `scroll-behavior: smooth`) anchor scroll alone to do its job.
  const skippedRef = useRef(false)
  // Whatever card/heading/etc. the click that's about to navigate actually
  // landed inside, captured in the capture phase — before Next's router
  // (which only reacts once the click bubbles back up) has done anything.
  // Read once in handleDone to align that same element's new-page position
  // to where it was on screen when clicked (see alignNewPageToTarget).
  const clickTargetRef = useRef<ClickAlignmentTarget | null>(null)
  // The object document.startViewTransition() returns — held onto so
  // handleDone can wait for transition.finished before invisibly undoing
  // the scroll/padding alignment trick (see alignNewPageToTarget's comment
  // for why that has to wait until the animation is actually over).
  const transitionRef = useRef<{ finished: Promise<void> } | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      clickTargetRef.current = captureClickAlignmentTarget(e)
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    function isHashOnlyChange(url: string) {
      return url.split('#')[0] === router.asPath.split('#')[0]
    }
    function handleStart(url: string) {
      if (isHashOnlyChange(url)) {
        skippedRef.current = true
        return
      }
      skippedRef.current = false
      if (!document.startViewTransition) return
      // Read by useReveal (components/reveal.tsx): anything it reveals
      // while this is true skips its own fade-in — the page's own arrival
      // (the cross-fade/morph) is already the "this just appeared"
      // animation, so a second one on top of it would fight for attention.
      viewTransitionState.active = true
      // Any card scrolled out of view right now (e.g. clicking into an
      // article from deep in a "Related articles" list) shouldn't morph
      // across several screens of distance to reach its counterpart on the
      // new page — see disableOffscreenTransitionNames' own comment for why
      // that's the API designer's own recommended fix for elements this
      // transition doesn't otherwise try to align. The one element
      // clickTargetRef points at (if any) gets a real aligned morph
      // instead — see handleDone.
      disableOffscreenTransitionNames()
      transitionRef.current = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            // A View Transition freezes the OLD page on screen (no spinner,
            // no feedback) until this promise resolves — fine when
            // routeChangeComplete fires in ~50ms, but Next 12's dev server
            // compiles pages on demand, so the *first* visit to a route in
            // a session can take a second or more, during which the page
            // reads as completely hung. Cap the wait: if the real
            // navigation hasn't finished by then, resolve anyway and let
            // the page snap in rather than freeze indefinitely. Fast
            // navigations (the common case once a page is compiled/cached)
            // still get the real transition; only a slow one loses it.
            //
            // 350ms measured too tight even in a production build: a
            // first-ever click into a not-yet-fetched dynamic route (e.g.
            // /blog/[slug], which still needs its own JSON data chunk) took
            // ~426ms measured directly, comfortably past 350ms — the
            // transition would resolve on the timeout with the OLD page
            // still on screen, so it "froze" for that stretch and then the
            // new page just popped in with no visible cross-fade once Next
            // actually finished, exactly the reported symptom. A cached
            // revisit measured ~194ms, well inside either cutoff. 600ms
            // covers the slow first-visit case with room to spare while
            // still being far short of "feels broken."
            let settled = false
            const settle = () => {
              if (settled) return
              settled = true
              resolve()
            }
            resolveRef.current = settle
            setTimeout(settle, 600)
          }),
      )
    }
    function handleDone() {
      if (skippedRef.current) return
      const transition = transitionRef.current
      transitionRef.current = null
      const clickTarget = clickTargetRef.current
      clickTargetRef.current = null

      if (transition) {
        // Next's own built-in scroll-to-top-on-navigate stopped taking
        // effect once the View Transition wrapper above was added — the
        // real `window.scrollY` (not just the visual position) was
        // verified stuck at its pre-navigation value after a client-side
        // nav, only resetting on a full page reload. Whatever the exact
        // interaction (a suspended-callback timing conflict with Next's
        // own scroll restoration is the leading suspect), the fix is to
        // stop relying on it and settle scroll ourselves — either to 0, or
        // (when a card was actually clicked) to wherever aligns that card
        // back to its old on-screen position. Either way this has to
        // happen BEFORE resolving the View Transition promise, not after —
        // resolving is what tells the browser "capture the new page now,"
        // and the new page's own useReveal instances mount and run their
        // first IntersectionObserver check around this same moment. If the
        // leftover pre-navigation scroll position is still live when that
        // check runs, far more cards read as "already on screen" than
        // actually end up above the fold once the scroll settles — those
        // get marked instantly-shown and never animate when the visitor
        // later scrolls down to them for real.
        const target = clickTarget ? findByTransitionName(clickTarget.name) : null
        const cleanupAlignment = alignNewPageToTarget(clickTarget)
        // Same off-screen check as before, now against the new page at its
        // settled scroll position — a card that only exists far down the
        // new page is just as wrong a long-distance morph target as one
        // left behind on the old page would be. The aligned target itself
        // (if any) is explicitly exempted — it's the one card this
        // transition deliberately placed off the natural top-of-page
        // position, on purpose, and it's already correctly on-screen there.
        disableOffscreenTransitionNames(target)
        resolveRef.current?.()
        resolveRef.current = null
        // Only unset the alignment scroll/padding trick once the browser's
        // own animation has actually finished — undoing it any earlier
        // would move the aligned element out from under the transition
        // while it's still visibly playing. Per the WICG explainer's
        // wording almost verbatim: offset to counteract the scroll
        // difference during the transition, "and unset once the
        // transition is complete."
        if (cleanupAlignment) transition.finished.then(cleanupAlignment, cleanupAlignment)
      } else {
        // No View Transition ran for this navigation (unsupported browser,
        // or the safety-valve timeout already fired) — same scroll-reset
        // fix as above, just without anything to align. Instant, not the
        // page's default smooth scroll — this is a correction, not a
        // user-facing scroll gesture.
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      }

      // Cleared a couple frames later, not synchronously — the new page's
      // useReveal instances mount and run their IntersectionObserver as an
      // effect right around this same moment, and need the flag to still
      // read true when their *first* check fires (whatever's already on
      // screen) so they skip their own animation. Below-the-fold content
      // hasn't intersected yet either way, so it's unaffected and still
      // reveals normally on a real later scroll.
      requestAnimationFrame(() => requestAnimationFrame(() => (viewTransitionState.active = false)))
    }
    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleDone)
    router.events.on('routeChangeError', handleDone)
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleDone)
      router.events.off('routeChangeError', handleDone)
    }
  }, [router])
}

export default function App({ Component, pageProps }: AppPropsType) {
  useViewTransitions()

  return (
    <DesignToggleProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 pt-10">
          <Component {...pageProps} />
        </div>
        <Footer />
      </div>
    </DesignToggleProvider>
  )
}
