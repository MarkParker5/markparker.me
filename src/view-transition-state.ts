// Plain mutable flag, not React state — read synchronously inside
// useReveal's IntersectionObserver callback at the moment it fires, with no
// need for every Reveal instance to subscribe/re-render on every change.
// Set around each route change in _app.tsx.
export const viewTransitionState = { active: false }

// Disables the morph for any named element that's scrolled entirely out of
// the viewport. Used as a fallback for every element EXCEPT the one
// `alignNewPageToTarget` below is actively aligning — that one gets a real
// aligned morph instead of being disabled; everything else (sibling cards,
// section headers, etc.) that ends up off-screen at the new scroll position
// still falls back to a plain cross-fade rather than a long-distance morph.
// This is the technique the API's own designer describes for the case
// where alignment isn't attempted at all: "if you give a header a
// view-transition-name, and you go from a state where you're scrolled down
// by 2000 pixels, to a state at the top of the page, the header will
// animate from 2000 pixels away, which feels wrong" (jakearchibald.com) —
// making the element behave "as if it doesn't have a view-transition-name"
// whenever its box doesn't intersect the viewport at all, the same rule
// the (not-yet-shippable) `view-transition-offscreen: absent` CSS proposal
// formalizes.
//
// Mutates the DOM directly rather than going through React state — this is
// a one-off override for this single transition's upcoming snapshot, not a
// persistent value anything needs to read back. The next real render (e.g.
// the following navigation) sets each element's real name fresh from
// scratch via its own `*TransitionStyle(id)` helper, so there's nothing to
// explicitly restore.
export function disableOffscreenTransitionNames(skip?: HTMLElement | null) {
  document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach((el) => {
    if (el === skip) return
    const rect = el.getBoundingClientRect()
    const offscreen = rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth
    if (offscreen) el.style.setProperty('view-transition-name', 'none')
  })
}

export type ClickAlignmentTarget = { name: string; oldRect: DOMRect }

// Call from a capture-phase document click listener, before Next's router
// (which only reacts in the bubble phase) has done anything — records
// which named card/heading/etc. the click actually landed inside, and
// exactly where it was on screen at that instant. Returns null for a
// modified click (opens in a new tab — nothing to align, since there's no
// "old" viewport position for a navigation that isn't really happening
// here) or a click with no named ancestor (e.g. a nav-bar link).
export function captureClickAlignmentTarget(e: MouseEvent): ClickAlignmentTarget | null {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null
  let el = e.target as HTMLElement | null
  while (el && el !== document.body) {
    const name = el.style?.getPropertyValue('view-transition-name')
    if (name && name !== 'none') return { name, oldRect: el.getBoundingClientRect() }
    el = el.parentElement
  }
  return null
}

// Exported so callers (see _app.tsx's handleDone) can look up the same
// element alignNewPageToTarget just aligned — e.g. to exempt it from
// disableOffscreenTransitionNames, which would otherwise see it sitting
// away from the natural top-of-page position (deliberately, on purpose)
// and wrongly treat that as "off-screen, disable the morph."
export function findByTransitionName(name: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]')
  return Array.from(all).find((el) => el.style.getPropertyValue('view-transition-name') === name) ?? null
}

// The core of "Plan B": instead of resetting the new page's scroll to 0 and
// letting the target card travel however far it needs to from its old
// on-screen position (the standard, jarring behavior — see
// disableOffscreenTransitionNames' comment), scroll the NEW page so that
// same card lands at the exact viewport position it had on the OLD page.
// The browser then sees "this element didn't move" and the morph plays as
// a true in-place transformation, with the rest of the new page's content
// sliding/fading in around it — the effect you get clicking a thumbnail on
// iOS regardless of how far down a list you'd scrolled.
//
// Just calling scrollTo() with the computed offset isn't enough on its
// own: the required offset can be negative (the target sits higher up the
// new page, in document coordinates, than where it needs to visually land
// — no such thing as scrolling to a negative position) or beyond the new
// page's natural scrollable range (the target is very close to the new
// page's own top or bottom edge). Both are fixed the same way: temporarily
// padding `<body>` — top to manufacture the "room above" a negative offset
// would need, bottom to manufacture "room below" when the natural page
// isn't tall enough to scroll that far. Per the WICG explainer's own
// (unelaborated) suggestion: "one of the pieces of content will need to be
// offset to counteract the scroll difference between the two, and unset
// once the transition is complete" — the unsetting half is the caller's
// job, via the cleanup function this returns, once transition.finished.
//
// Returns null when there's nothing to align (no target was clicked, or
// this specific card doesn't exist on the new page — e.g. it's a "Related"
// link to a different, unrelated project) — the caller falls back to a
// plain scrollTo(0, 0) in that case, same as before this existed.
export function alignNewPageToTarget(target: ClickAlignmentTarget | null): (() => void) | null {
  // `behavior: 'instant'` on every scrollTo call in this function — this
  // site sets `scroll-behavior: smooth` globally (styles/globals.css), and
  // without overriding it here each scrollTo() below just kicks off an
  // animation rather than moving the page synchronously. The very next
  // line always reads the element's position again immediately, assuming
  // the scroll it just requested has already happened; against a smooth
  // scroll it hasn't (the animation hasn't even started its first frame
  // yet), so that read comes back measuring whatever scroll position was
  // still left over from before this function ran at all, not 0 — this
  // was an actual bug caught via direct instrumentation (a "reset to 0"
  // read back a negative document-top for an element, which is only
  // possible if the scroll hadn't really reset yet).
  scrollToInstant(0)
  document.body.style.paddingTop = ''
  document.body.style.paddingBottom = ''
  if (!target) return null

  const el = findByTransitionName(target.name)
  if (!el) return null

  // Scroll is 0 right now, so the element's current viewport-relative top
  // IS its natural distance from the top of the document.
  const naturalDocumentTop = el.getBoundingClientRect().top
  const desiredScrollY = naturalDocumentTop - target.oldRect.top

  const viewportHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const paddingTop = Math.max(0, -desiredScrollY)
  const scrollWithPadding = desiredScrollY + paddingTop
  const maxScrollWithPadding = documentHeight + paddingTop - viewportHeight
  const paddingBottom = Math.max(0, scrollWithPadding - maxScrollWithPadding)

  if (paddingTop > 0) document.body.style.paddingTop = `${paddingTop}px`
  if (paddingBottom > 0) document.body.style.paddingBottom = `${paddingBottom}px`
  scrollToInstant(Math.max(0, scrollWithPadding))

  return () => {
    document.body.style.paddingTop = ''
    document.body.style.paddingBottom = ''
    scrollToInstant(0)
  }
}

function scrollToInstant(top: number) {
  // 'instant' is a real, standard ScrollBehavior value — just newer than
  // the one bundled with this project's TS/DOM lib version.
  window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
}
