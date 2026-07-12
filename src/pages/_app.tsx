import { AppPropsType } from 'next/dist/shared/lib/utils'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import '../../styles/globals.css'
import { Footer } from '../components/footer'
import { DesignToggleProvider } from '../design-toggles'

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

  useEffect(() => {
    function handleStart() {
      if (!document.startViewTransition) return
      document.startViewTransition(
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
            let settled = false
            const settle = () => {
              if (settled) return
              settled = true
              resolve()
            }
            resolveRef.current = settle
            setTimeout(settle, 350)
          }),
      )
    }
    function handleDone() {
      resolveRef.current?.()
      resolveRef.current = null
      // Next's own built-in scroll-to-top-on-navigate stopped taking
      // effect once the View Transition wrapper above was added — the
      // real `window.scrollY` (not just the visual position) was verified
      // stuck at its pre-navigation value after a client-side nav, only
      // resetting on a full page reload. Whatever the exact interaction
      // (a suspended-callback timing conflict with Next's own scroll
      // restoration is the leading suspect), the fix is to stop relying on
      // it and just force it ourselves.
      window.scrollTo(0, 0)
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
