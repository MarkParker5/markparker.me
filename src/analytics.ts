import { useEffect, useRef } from 'react'

type EventParams = Record<string, string | number | boolean | undefined>

// Clean, GA4-idiomatic tracking: a small set of canonical event names with
// structured parameters, rather than one bespoke event name per button
// (GA4's reporting/quota model is built around the former).
export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}

export function trackOutboundClick(platform: string, context: string) {
  trackEvent('outbound_click', { platform, context })
}

export function trackFilterChange(contentType: string, filter: string) {
  trackEvent('filter_change', { content_type: contentType, filter })
}

// action: 'like' | 'reply' | 'repost' | 'share' — the button pressed, not
// necessarily what happened next (that's on whichever platform the visitor
// lands on). platform is set only once they pick a mirror from the popover.
export function trackNoteAction(noteId: string, action: string, platform?: string) {
  trackEvent('note_action', { note_id: noteId, action, platform })
}

// Fires once per page view (on unmount / pagehide), reporting the raw
// signals — max scroll depth reached and total dwell time — rather than a
// single arbitrary "was this read" boolean. Lets reporting bucket however
// makes sense later instead of baking in a threshold now.
export function useReadTracking(contentType: string, id: string) {
  const startRef = useRef(0)
  const maxScrollRef = useRef(0)

  useEffect(() => {
    startRef.current = Date.now()

    function updateScroll() {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const pct = scrollable > 0 ? Math.min(100, Math.round((doc.scrollTop / scrollable) * 100)) : 100
      if (pct > maxScrollRef.current) maxScrollRef.current = pct
    }

    function sendEngagementEvent() {
      trackEvent('content_engagement', {
        content_type: contentType,
        content_id: id,
        scroll_pct: maxScrollRef.current,
        dwell_ms: Date.now() - startRef.current,
      })
    }

    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('pagehide', sendEngagementEvent)
    updateScroll()

    return () => {
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('pagehide', sendEngagementEvent)
      sendEngagementEvent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, id])
}
