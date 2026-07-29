import { AppPropsType } from 'next/dist/shared/lib/utils'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import '../../styles/globals.css'
import { Footer } from '../components/footer'
import { DesignToggleProvider } from '../design-toggles'
import {
  viewTransitionState,
  disableOffscreenTransitionNames,
  disableUnmatchedTransitionNames,
  collectActiveTransitionNames,
  captureClickAlignmentTarget,
  alignNewPageToTarget,
  findByTransitionName,
  findScrolledToPreviewCardAnchor,
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
    startViewTransition?: (callback: () => void | Promise<void>) => {
      finished: Promise<void>
      ready: Promise<void>
      skipTransition: () => void
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  import('@impulse.dev/runtime')
    .then((impulse) => impulse.run())
    .catch((e) => {
      console.error('could not load impulse', e)
    })
}

// Maps a content page's own route to the homepage section it's the "full
// page" version of — same slug SectionHeader derives from its title (see
// section-header.tsx), so `section-heading-${slug}` names the identical
// element on both sides. Every /blog/[slug] article page counts as "Blog"
// too — leaving an individual article for home should land on the Blog
// section, not fail to match anything just because the path isn't exactly
// /blog.
const HOME_SECTION_SLUG_BY_PATH: Record<string, string> = {
  '/notes': 'posts',
  '/projects': 'projects',
  '/blog': 'blog',
}
function homeSectionSlugForPath(path: string): string | null {
  const clean = path.split('?')[0].split('#')[0]
  if (HOME_SECTION_SLUG_BY_PATH[clean]) return HOME_SECTION_SLUG_BY_PATH[clean]
  if (clean.startsWith('/blog/')) return 'blog'
  return null
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
  // for why that has to wait until the animation is actually over), and so
  // handleStart can skipTransition() it if a NEW navigation starts before
  // this one's own handleDone has run (see handleStart's own comment).
  const transitionRef = useRef<{
    finished: Promise<void>
    ready: Promise<void>
    skipTransition: () => void
  } | null>(null)
  // Every view-transition-name still in effect on the OLD page at the
  // moment its snapshots are captured — recorded in handleStart, consumed
  // in handleDone to strip new-page names that have no old counterpart
  // (see disableUnmatchedTransitionNames).
  const oldNamesRef = useRef<Set<string>>(new Set())
  // "Where are we navigating FROM" — deliberately NOT read live from
  // window.location.pathname (or router.asPath) inside handleStart,
  // because which one lies about the current path, and in which
  // direction, depends on how the navigation was triggered:
  // - A click-driven navigation (router.push under the hood): Next
  //   controls exactly when history.pushState happens relative to firing
  //   routeChangeStart, and (confirmed via [vt] logging) router.asPath
  //   updates eagerly, before our handler runs — reading window.location
  //   was the fix for that case (see isHashOnlyChange's own history).
  // - A browser back/forward button (a `popstate` event): the OPPOSITE
  //   problem — the browser itself updates window.location as part of
  //   firing `popstate`, BEFORE any JS (Next's router included) gets to
  //   react, so window.location.pathname is already the DESTINATION by
  //   the time handleStart runs, same as the eager-asPath bug. That's
  //   exactly why the back button did a plain instant page swap instead
  //   of a morph: isHashOnlyChange compared url against the
  //   already-updated pathname, saw them match, and silently skipped the
  //   transition. Tracking it ourselves — updated only in handleDone,
  //   once a navigation has actually completed — is immune to both
  //   directions of staleness, since nothing but our own code writes to
  //   it.
  const currentPathRef = useRef(typeof window !== 'undefined' ? window.location.pathname : '/')
  // Set on click when the clicked link opted in via
  // `data-scroll-top-after-transition`, consumed once in handleDone. A
  // deliberate special case for the homepage's "see the latest →" link:
  // it still gets the normal aligned morph (it lives inside the projects
  // section, so it morphs the projects heading/cards into place like any
  // other projects link), but its WHOLE point is to show the newest items
  // — which sit at the TOP of the sorted destination — so once the morph
  // has finished playing, glide the page up to the top to reveal them.
  // Every other navigation keeps its aligned landing position.
  const scrollTopAfterRef = useRef(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      clickTargetRef.current = captureClickAlignmentTarget(e)
      const el = e.target as HTMLElement | null
      scrollTopAfterRef.current = !!el?.closest?.('[data-scroll-top-after-transition]')
      if (process.env.NODE_ENV === 'development') {
        const anchor = (e.target as HTMLElement)?.closest?.('a')
        console.log('[vt] click captured', {
          href: anchor?.getAttribute('href') ?? null,
          text: anchor?.textContent?.trim().slice(0, 30) ?? null,
          alignmentTarget: clickTargetRef.current?.name ?? null,
        })
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    // Diagnostic only (see conversation with the site owner about "no
    // morph going home"): [vt] logging showed zero output for that specific
    // click, meaning handleStart below never even ran — the leading
    // suspect is a REAL browser navigation (full reload) happening instead
    // of Next's client-side router, which would never fire
    // routeChangeStart at all. `pagehide` fires on a genuine navigation
    // away from the page; it does NOT fire for a Next.js client-side route
    // change (the page never actually unloads for those). Whichever one
    // logs right after a "Home" click answers the question directly.
    if (process.env.NODE_ENV !== 'development') return
    function handlePageHide(e: PageTransitionEvent) {
      console.log('[vt] pagehide — a REAL browser navigation is happening, not a client-side route change', {
        persisted: e.persisted,
      })
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [])

  useEffect(() => {
    // We fully own the scroll position on every client-side navigation
    // now — handleDone always settles it, either to an aligned position
    // (alignNewPageToTarget) or to 0. The browser's NATIVE history scroll
    // restoration ('auto', the default — nothing in this app ever touched
    // it) does its own restore on every back/forward: it re-applies
    // whatever scroll the destination page had when the visitor LEFT it,
    // asynchronously, after our synchronous scroll has already run — so
    // on back-navigation the visitor landed wherever the page happened to
    // be scrolled at departure time, with our alignment silently
    // overwritten a moment later. That's exactly the "back from content's
    // top lands me deep at 'All projects'; back from content's bottom
    // lands me at 0" report: neither landing had anything to do with the
    // alignment math — both were echoes of home's scroll at the moment it
    // was left. (Live measurements in a background tab looked correct for
    // the same reason they were misleading: a tab that never paints never
    // runs the deferred native restore.)
    //
    // Gated on View Transition support, deliberately: in a browser
    // without it (Safari) none of the alignment machinery runs, and
    // native restoration is doing real, correct work there — leave it on.
    if (!document.startViewTransition) return
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useEffect(() => {
    // NOT window.location.pathname or router.asPath — see currentPathRef's
    // own comment above for why both lie about "where we're navigating
    // FROM," just in opposite directions depending on how the navigation
    // was triggered.
    function isHashOnlyChange(url: string) {
      return url.split('#')[0] === currentPathRef.current
    }
    function handleStart(url: string) {
      const log = process.env.NODE_ENV === 'development' ? (...args: unknown[]) => console.log('[vt]', ...args) : () => {}
      if (isHashOnlyChange(url)) {
        log('skip: hash-only change', { url, currentPath: currentPathRef.current })
        skippedRef.current = true
        return
      }
      skippedRef.current = false
      if (!document.startViewTransition) {
        log('skip: startViewTransition unsupported')
        return
      }
      log('start', { url, currentPath: currentPathRef.current, hidden: document.hidden })
      // A navigation starting before the PREVIOUS one's handleDone has run
      // (e.g. clicking straight through to another page while the last
      // transition is still visually playing) means a transition is still
      // active on the document — the View Transition spec only allows one
      // at a time, and starting a second while the first hasn't been
      // explicitly ended rejects with "InvalidStateError: Transition was
      // aborted because of invalid state" (confirmed directly by
      // monkey-patching document.startViewTransition and reading the
      // rejection off the second call's own .ready promise). skipTransition()
      // cleanly ends the old one first — it jumps straight to the new
      // page with no animation for that one navigation, which is a far
      // better outcome than silently getting no morph at all for THIS one.
      transitionRef.current?.skipTransition()
      transitionRef.current = null
      // Read by useReveal (components/reveal.tsx): anything it reveals
      // while this is true skips its own fade-in — the page's own arrival
      // (the cross-fade/morph) is already the "this just appeared"
      // animation, so a second one on top of it would fight for attention.
      viewTransitionState.active = true
      // The reverse direction of the click-alignment trick: leaving a
      // content page (near the top, having just been reading it) for the
      // homepage should land on that same section of the homepage, not get
      // dumped at the very top profile header — otherwise going "back"
      // reads as a bigger jump than the click that got you here in the
      // first place, even though both stops are technically scrolled to 0.
      // Deliberately overrides whatever the click-capture listener above
      // already found (typically the site logo, which carries its own
      // `site-title` name and links to "/" from every page) — the logo is
      // pinned to the very top of both pages either way, so aligning to
      // *that* would just reproduce "always land at the top," exactly the
      // jump this is meant to avoid. Aligning to the CURRENT page's own
      // SectionHeader instead: notes.tsx/projects.tsx/blog.tsx each render
      // one with `hideTitleOption` but no `href`, carrying the exact same
      // `section-heading-${slug}` name the homepage's version of that
      // section does (see section-header.tsx) — same trick, no new
      // mechanism, just a different (synthesized rather than clicked)
      // starting element.
      const destPath = url.split('?')[0].split('#')[0]
      if (destPath === '/') {
        // Same reason as isHashOnlyChange above — currentPathRef, not
        // window.location.pathname, is the trustworthy read of "where
        // we're navigating FROM" at this point in the lifecycle.
        const slug = homeSectionSlugForPath(currentPathRef.current)
        // The real anchor: whichever of the homepage preview's OWN cards
        // the visitor has actually scrolled to on this content page —
        // see findScrolledToPreviewCardAnchor's own comment for the full reasoning
        // (why the section heading alone isn't a reliable "where was I"
        // signal, and why "scrolled past everything the preview has"
        // gets a different treatment than "still within it"). Only
        // falls back to the heading when no preview card has been
        // reached at all — i.e. genuinely still at/near the top.
        const anchor = slug ? findScrolledToPreviewCardAnchor(slug) : null
        const heading = !anchor && slug ? findByTransitionName(`section-heading-${slug}`) : null
        log('going home', {
          slug,
          anchor: anchor?.name ?? null,
          headingFound: !!heading,
          priorClickTarget: clickTargetRef.current?.name ?? null,
        })
        if (anchor) {
          clickTargetRef.current = anchor
        } else if (slug && heading) {
          clickTargetRef.current = { name: `section-heading-${slug}`, oldRect: heading.getBoundingClientRect() }
        } else {
          // Nothing to align to at all — a transition should still run
          // (root cross-fade at minimum). If the destination *should*
          // have a named target and this logs `headingFound: false`,
          // that's the bug: something upstream (design toggle hiding the
          // title, wrong slug mapping) removed the name before this ran.
          clickTargetRef.current = null
        }
      }
      // Any card scrolled out of view right now (e.g. clicking into an
      // article from deep in a "Related articles" list) shouldn't morph
      // across several screens of distance to reach its counterpart on the
      // new page — see disableOffscreenTransitionNames' own comment for why
      // that's the API designer's own recommended fix for elements this
      // transition doesn't otherwise try to align. The one element
      // clickTargetRef points at (if any) gets a real aligned morph
      // instead — see handleDone. Must be exempted here too (`skip`), not
      // just there: this call runs against the OLD page, and the "going
      // home" synthesized target above (the current content page's own
      // section heading) is routinely off-screen right here — you scroll
      // down to read, then click Home. Without the exemption this stripped
      // that exact element's view-transition-name a moment before the
      // transition started, silently killing the morph it was set up to
      // align.
      // Collected BEFORE the offscreen prune below, deliberately — this is
      // "does a counterpart for this name exist anywhere on the old page,"
      // not "is it currently in the viewport." Collecting it after
      // pruning was the bug: navigating home → Projects (via the nav
      // link, not the Projects heading itself) leaves the Projects
      // section scrolled out of view on the home page you're leaving, so
      // disableOffscreenTransitionNames had already stripped its names —
      // the later pairing check then couldn't tell "off-screen but real"
      // apart from "genuinely doesn't exist" (the actual /blog-articles
      // case this was built for) and wiped the ENTIRE destination page's
      // content, treating all of it as unpaired.
      oldNamesRef.current = collectActiveTransitionNames()
      log('old-page active names', Array.from(oldNamesRef.current))
      const alignTargetEl = clickTargetRef.current ? findByTransitionName(clickTargetRef.current.name) : null
      // Not restored — this page is being navigated AWAY from, so its DOM
      // is about to be torn down regardless (even if this specific
      // transition gets skipTransition()'d by an overlapping navigation,
      // SOME navigation away from it is still in flight).
      disableOffscreenTransitionNames(alignTargetEl)
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
      if (process.env.NODE_ENV === 'development') {
        const startedAt = Date.now()
        log('startViewTransition called')
        // A transition can silently die AFTER startViewTransition returns
        // successfully — duplicate view-transition-names on either page, a
        // hidden document, a viewport resize mid-capture all abort it with
        // the animation never playing (it cuts straight to the new page,
        // which reads as "no morph at all" with no error anywhere). The
        // abort reason only surfaces as this promise's rejection, so log
        // it where it can actually be seen.
        transitionRef.current.ready.then(
          () => log('ready: animation about to play', { ms: Date.now() - startedAt }),
          (err) => console.warn('[vt] aborted before animating:', err, { ms: Date.now() - startedAt }),
        )
        transitionRef.current.finished.then(
          () => log('finished: animation complete', { ms: Date.now() - startedAt }),
          (err) => console.warn('[vt] finished rejected:', err, { ms: Date.now() - startedAt }),
        )
      }
    }
    function handleDone() {
      if (skippedRef.current) return
      // The one place this updates — see currentPathRef's own comment.
      // By routeChangeComplete, Next has definitely finished navigating,
      // so window.location really is the new page now, safe to adopt as
      // the new "current."
      currentPathRef.current = window.location.pathname
      const transition = transitionRef.current
      transitionRef.current = null
      const clickTarget = clickTargetRef.current
      clickTargetRef.current = null
      // Consume-and-reset so it only fires for the click that set it — a
      // later back/forward navigation (which never runs handleClick)
      // won't inherit a stale "scroll to top" from an earlier click.
      const scrollTopAfter = scrollTopAfterRef.current
      scrollTopAfterRef.current = false
      if (process.env.NODE_ENV === 'development') {
        console.log('[vt] routeChangeComplete', {
          hadTransition: !!transition,
          alignTargetName: clickTarget?.name ?? null,
        })
      }

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
        const restoreOffscreenNames = disableOffscreenTransitionNames(target)
        if (process.env.NODE_ENV === 'development') {
          console.log('[vt] new-page names before pairing check', Array.from(collectActiveTransitionNames()))
        }
        // And the pairing check: any name on the new page with no old-side
        // counterpart isn't morphing either — it'd get the browser's own
        // "entering content" fade, playing mid-transition (see
        // disableUnmatchedTransitionNames).
        const restoreUnmatchedNames = disableUnmatchedTransitionNames(oldNamesRef.current)
        if (process.env.NODE_ENV === 'development') {
          console.log('[vt] new-page names after pairing check', Array.from(collectActiveTransitionNames()))
        }
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
        // Same reasoning, same timing: these two also mutated the NEW
        // page's DOM directly (bypassing React), and the new page might
        // not unmount before the next navigation away from it — restoring
        // the real names now is what keeps a second outgoing click (e.g.
        // "All posts →" right after arriving home) reading correct,
        // uncorrupted state instead of whatever this transition stripped.
        transition.finished.then(restoreOffscreenNames, restoreOffscreenNames)
        transition.finished.then(restoreUnmatchedNames, restoreUnmatchedNames)
        // The "see the latest →" special case: let the aligned morph play
        // out fully, THEN glide to the top (smooth, so it reads as a
        // deliberate reveal of the newest items rather than a jump). Runs
        // after the cleanup .thens above so it's the last scroll to touch
        // the page. Fires on both resolve and reject of finished — even a
        // skipped/aborted transition should still land at the top for this
        // link, since that's the whole intent.
        if (scrollTopAfter) {
          const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
          transition.finished.then(toTop, toTop)
        }
      } else {
        // No View Transition ran for this navigation (unsupported browser,
        // or the safety-valve timeout already fired) — same scroll-reset
        // fix as above, just without anything to align. Instant, not the
        // page's default smooth scroll — this is a correction, not a
        // user-facing scroll gesture. (The "scroll to top after" opt-in
        // needs no special handling here: with no transition we already
        // land at the top.)
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
    // Deliberately NOT `[router]` — `router` from useRouter() gets a fresh
    // object identity on every route change (it's the same underlying
    // singleton, but the hook returns a new wrapper each time), so a
    // `[router]` dependency re-ran this effect on every single navigation:
    // unsubscribe the old listeners, then immediately resubscribe fresh
    // ones. `router.events` is the same stable emitter for the lifetime of
    // the app regardless of which render captured it, so subscribing once
    // and never re-subscribing is correct, not just a workaround.
    //
    // (An earlier version of this comment blamed the resubscription itself
    // for calling document.startViewTransition twice per click — checked
    // directly with a local counter inside a monkey-patched
    // startViewTransition, immune to any console-logging quirks, and it
    // reported exactly one real call. The actual InvalidStateError cause
    // was a genuinely overlapping SECOND navigation starting before the
    // first one's handleDone had run — see the skipTransition() call in
    // handleStart above. This `[]` dependency is still the right call —
    // avoiding needless resubscribe/reconnect churn on every navigation —
    // it just isn't what fixed that particular bug.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export default function App({ Component, pageProps }: AppPropsType) {
  useViewTransitions()

  return (
    <DesignToggleProvider>
      {/* Global viewport — set here (not in _document, which Next warns against)
          so every page renders at real device width on mobile. */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 pt-10">
          <Component {...pageProps} />
        </div>
        <Footer />
      </div>
    </DesignToggleProvider>
  )
}
