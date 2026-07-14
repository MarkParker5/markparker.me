import { getPreviewNotes } from './note'
import { getSpotlightProjects } from './project'
import { getPublicArticles } from './article'

// Plain mutable flag, not React state — read synchronously inside
// useReveal's IntersectionObserver callback at the moment it fires, with no
// need for every Reveal instance to subscribe/re-render on every change.
// Set around each route change in _app.tsx. Read by useReveal at mount to
// decide whether a page arrived via a View Transition (skip the
// scroll-triggered entrance animation for whatever's already on screen —
// the transition's own cross-fade/morph IS its arrival animation) or a
// plain navigation/fresh load (normal scroll-reveal behavior).
export const viewTransitionState = {
  active: false,
}

// Same idea, for the dev-only "Enable offscreen animation" toggle
// (design-toggles.tsx) — _app.tsx's useViewTransitions hook runs outside
// DesignToggleProvider's own subtree (it's called directly in the App
// component, a sibling of the Provider it renders, not a descendant), so it
// can't read the toggle via useDesignToggles()/context. DesignToggleProvider
// mirrors the toggle into this plain flag instead, the same side-channel
// --vt-duration/--font-sans already use for the same reason, just as a JS
// value instead of a CSS variable since the reader here is plain JS, not CSS.
export const debugFlags = { enableOffscreenAnimation: false }

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
// Persistent site chrome (the "Mark Parker" logo/header and the rule under
// it) is exempt, always — not just the specific element this transition
// happens to be aligning. Scrolling to align some OTHER target (e.g. a
// SectionHeader sitting below where the compact header ends) routinely
// scrolls the header itself out of view as a side effect, which isn't the
// same thing as "this is unrelated content that happens to be far away" —
// it's the one element every page shares, and its own morph shouldn't be
// held hostage to whether something else on the page needed a big scroll.
export const ALWAYS_EXEMPT_NAMES = new Set(['site-title', 'site-title-divider'])

// Both name-disabling functions below mutate `el.style` directly rather
// than through React, and BOTH now return a restore function instead of
// leaving that mutation in place indefinitely. The assumption that "the
// next real render sets each element's name fresh from scratch" only
// holds when the component actually unmounts/remounts — true for a page
// you navigate AWAY from and back to, but false for a page you're still
// sitting on: clicking a second link (e.g. "All posts →" right after
// arriving home) reads the SAME already-mutated DOM nodes from the
// PREVIOUS navigation, since nothing ever put them back. That's exactly
// what made "click Projects, go home, then Posts is stuck invisible" a
// real bug — home's OWN Posts names had been stripped to 'none' by the
// Projects→home pairing check and simply never recovered.
type RestoreNames = () => void

export function disableOffscreenTransitionNames(skip?: HTMLElement | null): RestoreNames {
  if (debugFlags.enableOffscreenAnimation) return () => {}
  const restores: Array<() => void> = []
  document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach((el) => {
    if (el === skip) return
    const original = el.style.getPropertyValue('view-transition-name')
    if (ALWAYS_EXEMPT_NAMES.has(original)) return
    const rect = el.getBoundingClientRect()
    const offscreen = rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth
    if (offscreen) {
      el.style.setProperty('view-transition-name', 'none')
      restores.push(() => el.style.setProperty('view-transition-name', original))
    }
  })
  return () => restores.forEach((r) => r())
}

// Every name currently in effect (i.e. not reset to 'none') in the DOM.
// Called in _app.tsx's handleStart against the OLD page, BEFORE
// disableOffscreenTransitionNames prunes it — this needs to answer "does a
// counterpart for this name exist anywhere on the old page," not "is it
// currently in the viewport." Collecting it after pruning was a real bug:
// navigating home→Projects via the nav link (not the Projects heading)
// leaves the Projects section scrolled out of view on the home page,
// already offscreen-pruned by the time this ran — the later pairing check
// then couldn't tell "off-screen but real" apart from "genuinely doesn't
// exist" and wiped the destination page's entire content.
export function collectActiveTransitionNames(): Set<string> {
  const names = new Set<string>()
  document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach((el) => {
    const name = el.style.getPropertyValue('view-transition-name')
    if (name && name !== 'none') names.add(name)
  })
  return names
}

// The complement of disableOffscreenTransitionNames, for the NEW page: an
// element that carries a name with no counterpart in the old page's
// capture set isn't going to morph — the browser treats it as "entering"
// content and plays its own per-element fade-in for it, IN PARALLEL with
// the root cross-fade and before the transition finishes. That's exactly
// the "articles show up mid-morph via cross-fade instead of the reveal"
// bug on /blog: the homepage only ever shows the 3 latest articles, so
// every other above-the-fold row on /blog had a name with no old-side
// pair. Stripping those names makes them plain page content, which the
// reveal system then correctly holds hidden until the transition settles.
// Names in ALWAYS_EXEMPT_NAMES are left alone for the same reason they're
// exempt everywhere else (persistent chrome).
export function disableUnmatchedTransitionNames(oldNames: Set<string>): RestoreNames {
  const restores: Array<() => void> = []
  document.querySelectorAll<HTMLElement>('[style*="view-transition-name"]').forEach((el) => {
    const name = el.style.getPropertyValue('view-transition-name')
    if (!name || name === 'none') return
    if (ALWAYS_EXEMPT_NAMES.has(name)) return
    if (!oldNames.has(name)) {
      el.style.setProperty('view-transition-name', 'none')
      restores.push(() => el.style.setProperty('view-transition-name', name))
    }
  })
  return () => restores.forEach((r) => r())
}

export type ClickAlignmentTarget = { name: string; oldRect: DOMRect }

// The exact same ids the homepage preview renders for this section, in the
// exact same order — read directly from the same data functions
// index.tsx itself calls, not derived from the (unavailable, since we're
// not currently ON the homepage) home DOM. Doesn't account for a filtered
// homepage (?notes=..., etc.) — going home always lands on the plain,
// unfiltered "/", so that's the only case this needs to match.
function previewCardNamesForSlug(slug: string): string[] {
  if (slug === 'posts') return getPreviewNotes(3).map((n) => `note-card-${n.id}`)
  if (slug === 'projects') return getSpotlightProjects().map((p) => `project-card-${p.id}`)
  if (slug === 'blog') return getPublicArticles().slice(0, 3).map((a) => `article-card-${a.id}`)
  return []
}

// The correct anchor for a transition between a section's homepage
// preview and its own full content page is whichever of the preview's OWN
// cards the visitor has actually scrolled to — not the section heading,
// which stops meaning anything the moment you've scrolled past it (using
// it anyway is what made "scroll down 3 cards, then go back" land at
// completely the wrong spot), and not a fixed link either (nothing about
// a link's own position corresponds to "where the visitor was reading").
// Direction-agnostic on purpose: called against whichever document is
// CURRENTLY active — the homepage (clicking "All <content> →" itself,
// which isn't nested inside its own SectionHeader — see
// captureClickAlignmentTarget) or a content page (going home) — the scan
// only ever looks at named elements in the live DOM, so the same logic
// answers "where was I" correctly on either side.
//
// "Reached" means the card's top edge is at or above the bottom of the
// viewport — scanning in list order and keeping the LAST one that
// qualifies finds the furthest point the visitor has actually scrolled
// to. Two different outcomes from there:
// - Still genuinely on screen (top >= 0): true Plan-B alignment — align
//   using its REAL current position, so it lands in the exact same screen
//   spot on the other side, preserved exactly.
// - Already scrolled entirely above the viewport (top < 0) — meaning the
//   visitor kept reading past every card the preview has and is now
//   looking at content with no equivalent on the other side. There's
//   nothing further down to align to, so this deliberately does NOT try
//   to preserve its (no longer meaningful) exact former position; it
//   anchors that same last-matched card to the very TOP of the screen
//   instead — the natural place to land "I've read past what the preview
//   has, here's the closest point that still exists on both sides."
//
// Returns null when none of the preview cards have been reached yet
// (still scrolled above all of them, or the page renders none at all) —
// the caller falls back to the section heading in that case, which is
// still the right anchor for "I'm at or near the top of this page."
export function findScrolledToPreviewCardAnchor(slug: string): ClickAlignmentTarget | null {
  const names = previewCardNamesForSlug(slug)
  let lastReached: { name: string; rect: DOMRect } | null = null
  for (const name of names) {
    const el = findByTransitionName(name)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) lastReached = { name, rect }
  }
  if (!lastReached) return null
  const { name, rect } = lastReached
  if (rect.top >= 0) return { name, oldRect: rect }
  return { name, oldRect: { top: 0 } as DOMRect }
}

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
    // Checked BEFORE this element's own view-transition-name, not after —
    // relevant once an element ever carries both. `data-align-heading`
    // ("All posts →" 's <Reveal> wrapper, index.tsx — not nested inside
    // its own SectionHeader, so the walk below would otherwise never find
    // a named ancestor for it at all) means a click landing anywhere in
    // here should align to this SECTION, not to whatever incidental name
    // this specific element might carry.
    //
    // The section itself, not always the heading: if any of the
    // homepage's own preview cards for this slug have already been
    // scrolled to, align to that instead — same reasoning as going home,
    // see findScrolledToPreviewCardAnchor's own comment. Landing on the
    // heading regardless of what was actually on screen is what made
    // "scroll home down to Projects, click All projects" land on the
    // wrong part of the destination page.
    const alignSlug = el.dataset?.alignHeading
    if (alignSlug) {
      const anchor = findScrolledToPreviewCardAnchor(alignSlug)
      if (anchor) return anchor
      const heading = findByTransitionName(`section-heading-${alignSlug}`)
      if (heading) return { name: `section-heading-${alignSlug}`, oldRect: heading.getBoundingClientRect() }
    }
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
// The required offset can land beyond the new page's natural scrollable
// range in two different ways, and only ONE of them is safe to compensate
// for with padding:
//
// - Target's natural position is BELOW the reachable scroll range (very
//   close to the new page's own bottom edge, or the page is short). Padding
//   the BOTTOM of <body> manufactures the missing scroll room — safe to add
//   and later remove, because that space sits below whatever's currently
//   in the viewport; removing it again never moves anything the visitor
//   can see.
// - Target's natural position is ABOVE where it needs to land (negative
//   offset — the homepage's own version of a section can easily sit higher
//   up than the content page's compact header pushed it to). Padding the
//   TOP would work the same way mathematically, but is NOT safe: removing
//   top padding after the transition shifts every already-on-screen
//   element upward, instantly, with no animation — visible as exactly the
//   "moves up then drops with no animation" glitch this was built to
//   avoid, not fix. There's no way to hide that "unset" the way there is
//   for bottom padding, since top padding sits above the fold by
//   definition. So this case is simply clamped to 0 instead: the closest
//   reachable position, not a mathematically perfect match, but stable —
//   nothing added, nothing to visibly correct once the transition ends.
//
// Per the WICG explainer's own (unelaborated) suggestion: "one of the
// pieces of content will need to be offset to counteract the scroll
// difference between the two, and unset once the transition is complete"
// — the unsetting half is the caller's job, via the cleanup function this
// returns, once transition.finished.
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
  document.body.style.paddingBottom = ''
  if (!target) return null

  const el = findByTransitionName(target.name)
  if (!el) return null

  // Scroll is 0 right now, so the element's current viewport-relative top
  // IS its natural distance from the top of the document.
  const naturalDocumentTop = el.getBoundingClientRect().top
  let desiredScrollY = naturalDocumentTop - target.oldRect.top

  // Alignment exists to spare the target a LONG, jarring on-screen journey
  // — when the journey would be short anyway, skip the alignment and land
  // at the natural top of the page instead. Two real cases pinned this
  // rule down:
  // - "Posts" clicked from home: its homepage position sits close to its
  //   natural /notes position, so the required scroll was small (~150px)
  //   but still enough to clip the logo/nav off the top — a broken-looking
  //   landing bought for almost nothing (the un-aligned morph only travels
  //   those same ~150px, which reads fine).
  // - Going home from /projects: the Projects section lives most of a
  //   screen down the homepage. Landing at 0 would send the heading
  //   morphing across the entire viewport (and the visitor loses "I'm at
  //   the projects part of home" — they land at the profile instead). This
  //   is the case alignment is FOR; scrolling the header out of view is
  //   the right trade here.
  // A blanket "never hide the header" cap (the previous attempt) forced
  // BOTH cases to 0 and silently disabled the whole mechanism.
  if (desiredScrollY < window.innerHeight / 3) desiredScrollY = 0

  const viewportHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const maxScroll = documentHeight - viewportHeight
  const paddingBottom = Math.max(0, desiredScrollY - maxScroll)

  if (paddingBottom > 0) document.body.style.paddingBottom = `${paddingBottom}px`
  scrollToInstant(Math.max(0, desiredScrollY))

  // Only the padding needs undoing — it's an artificial spacer with no
  // content of its own. The scroll position doesn't: since top-padding is
  // never used (see above), wherever this landed is always a real,
  // legitimate position already on the page, not something manufactured
  // that needs reverting. Resetting to 0 here was a real bug — it undid a
  // correct "land scrolled to where the content you came from now lives"
  // outcome (e.g. arriving home from /projects and landing on the Projects
  // section) back to the top for no reason, every time, with no animation.
  return () => {
    document.body.style.paddingBottom = ''
  }
}

function scrollToInstant(top: number) {
  // 'instant' is a real, standard ScrollBehavior value — just newer than
  // the one bundled with this project's TS/DOM lib version.
  window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
}
