import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react'
import { debugFlags } from './view-transition-state'

// Dev-only A/B toggles for design decisions still under review — lets us
// compare two real options live instead of guessing from a screenshot.
// Never rendered in production (gated the same way preview notes are).
export type StatusStyle = 'circle' | 'border'
export type CardStyle = 'border' | 'divider'
// Three-way visibility for a piece of page chrome (the header divider, a
// page title): shown everywhere, hidden everywhere, or 'desktop' — shown
// on wider screens (the `md` breakpoint and up) and hidden on mobile, for
// chrome that reads well on a desktop but is just clutter on a phone.
export type ChromeVisibility = 'shown' | 'hidden' | 'desktop'
// Click order for the 3-state chrome-visibility cyclers in the panel.
const CHROME_ORDER: ChromeVisibility[] = ['shown', 'hidden', 'desktop']
function nextChrome(v: ChromeVisibility): ChromeVisibility {
  return CHROME_ORDER[(CHROME_ORDER.indexOf(v) + 1) % CHROME_ORDER.length]
}
// 'upload' is the old fa-arrow-up-from-bracket glyph — easy to misread as
// "upload this post" rather than "share it". 'branch' (fa-share, solid) is
// the winning shape; FA's Free set has no true outline weight for that
// exact glyph, so 'branch-outline' uses fa-share-from-square (regular
// weight) instead — same square-with-arrow-out shape language, but matches
// reply/like which are already outline-weight (fa-regular) icons, so it's
// the default. 'nodes' (fa-share-nodes) is kept only as a fallback
// comparison.
export type ShareIconStyle = 'upload' | 'branch' | 'branch-outline' | 'nodes'
// Whether the date or the owner/role reads first on a project card's meta
// line — "2022 · Personal" (chronological-first) vs "Personal · 2022"
// (context-first).
export type MetaOrder = 'date-first' | 'owner-first'
export type FontFamily = 'open-sans' | 'inter'

type DesignToggles = {
  statusStyle: StatusStyle
  cardStyle: CardStyle
  shareIcon: ShareIconStyle
  fontFamily: FontFamily
  // 0–100, how far each tag pill's per-tag hue is blended toward the
  // theme's neutral "muted" color (see TAG_COLORS + color-mix in
  // projects-list.tsx). 0 = fully colored (every tag its own distinct
  // hue, reads as categories at a glance); 100 = fully muted (one flat
  // neutral fill, calmer/closer to GitHub-default, but tags no longer
  // differentiate at a glance). The slider replaced a binary
  // colorful/muted toggle so the calmer-but-still-a-little-colored middle
  // is reachable.
  tagColorMuting: number
  // 0–150, percent of extra breathing room added between a project card's
  // rows on top of the base spacing — named for what it DOES (adds space),
  // not the inverse effect that has on density, which read backwards ("50%
  // density" sounded like MORE density when it actually means less). 10 was
  // the first ask ("~10% less dense" = "+10% spacing").
  spacing: number
  metaOrder: MetaOrder
  // When true, a note's action popover only lists mirrors that can do
  // something real for that action: a direct link to the actual post, or
  // (reply/repost only) a Twitter compose intent. It drops the "just go to
  // my profile" entries, which aren't an action on this post at all. Off
  // shows every mirror account regardless, same as before this toggle
  // existed.
  hideUnavailableMirrors: boolean
  // Whether ArticleLayout draws its <hr> between the "Mark Parker" header/
  // nav and the page's own title ("Posts"/"Projects"/"Blog"/an article) —
  // shared across every content page since they all use ArticleLayout.
  // 'desktop' keeps the rule on wider screens but drops to a plain gap on
  // mobile.
  headerDivider: ChromeVisibility
  // Visibility of /notes, /projects, /blog's own big title ("Posts"/
  // "Projects"/"Blog") — the description line and mirror icons always
  // stay. Scoped to those three pages only (see SectionHeader's
  // `hideTitleOption` prop) — the homepage's section headings always show,
  // they're doing real wayfinding work there. 'desktop' shows the title on
  // wider screens and hides it on mobile.
  pageTitle: ChromeVisibility
  // Seconds — overrides the View Transition's CSS animation-duration (see
  // --vt-duration in globals.css) for every page-to-page navigation. Real
  // production value is 0.18–0.32s; slowed way down here to actually watch
  // a transition frame-by-frame while debugging it, not a design decision
  // of its own.
  transitionDuration: number
  // Debug escape hatch for disableOffscreenTransitionNames (see
  // view-transition-state.ts) — when true, an element that's scrolled
  // entirely out of view still gets to morph across the transition rather
  // than falling back to a cross-fade. Real behavior wants this off (a
  // long-distance morph is jarring, see that function's own comment); on
  // is for comparing the two side by side while chasing morph bugs that
  // might be caused by the offscreen check itself misfiring.
  enableOffscreenAnimation: boolean
  // Whether/how a morphing element's CONTENT resizes along with its box
  // (`vt-size-morph-cover`/`vt-size-morph-contain` class on <html> — see
  // the ::view-transition-old/new rules in globals.css) instead of the
  // browser-default cross-fade between the two natural-size snapshots.
  // 'off' by default — 'cover' zoom-crops hard whenever the old/new
  // aspect ratios differ (they nearly always do for text cards across
  // this site's two layouts); 'contain' avoids that at the cost of
  // letterboxing instead. See the CSS comment for the full tradeoff.
  sizeMorph: 'off' | 'cover' | 'contain'
  // UI-only preference for the panel itself, not a design decision — kept
  // in the same persisted object for simplicity.
  panelCollapsed: boolean
}

// The current committed design choices (also what production renders,
// since the panel below is dev-only and prod falls back to these). Design
// knobs reflect the settings dialed in via the A/B panel; the two DEBUG
// knobs deliberately stay at prod-safe values regardless of panel state —
// transitionDuration at the real 0.18–0.32s feel (NOT a slowed-down
// debugging value) and enableOffscreenAnimation off (it's a morph-bug
// comparison aid, not a shipping behavior).
const DEFAULTS: DesignToggles = {
  statusStyle: 'circle',
  cardStyle: 'divider',
  shareIcon: 'branch-outline',
  fontFamily: 'open-sans',
  tagColorMuting: 80,
  spacing: 20,
  metaOrder: 'date-first',
  hideUnavailableMirrors: true,
  headerDivider: 'desktop',
  pageTitle: 'desktop',
  transitionDuration: 0.32,
  enableOffscreenAnimation: false,
  sizeMorph: 'cover',
  panelCollapsed: false,
}
const STORAGE_KEY = 'design-toggles'

const DesignToggleContext = createContext<DesignToggles>(DEFAULTS)

export function useDesignToggles() {
  return useContext(DesignToggleContext)
}

const isDev = process.env.NODE_ENV === 'development'

export function DesignToggleProvider({ children }: PropsWithChildren<{}>) {
  const [toggles, setToggles] = useState<DesignToggles>(DEFAULTS)

  useEffect(() => {
    if (!isDev) return
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        // Merged over DEFAULTS, not a wholesale replace — a localStorage
        // blob saved before some toggle existed (e.g. `fontFamily` added
        // after someone's browser already had a save) would otherwise come
        // back `undefined` for that key forever, which then rendered as a
        // blank button or fell through to the wrong side of a `=== x ? a :
        // b` ternary instead of a real default.
        setToggles({ ...DEFAULTS, ...JSON.parse(saved) })
      } catch {
        // ignore corrupt storage, fall back to defaults
      }
    }
  }, [])

  function update(partial: Partial<DesignToggles>) {
    setToggles((prev) => {
      const next = { ...prev, ...partial }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  // Flips the CSS variable every `font-sans` utility resolves through (see
  // tailwind.config.js) — swaps the whole site's typeface without touching
  // any component.
  useEffect(() => {
    if (!isDev) return
    document.documentElement.style.setProperty(
      '--font-sans',
      toggles.fontFamily === 'inter' ? 'Inter, sans-serif' : "'Open Sans', sans-serif",
    )
  }, [toggles.fontFamily])

  // Same idea, for the View Transition's own animation-duration (see
  // --vt-duration in globals.css).
  useEffect(() => {
    if (!isDev) return
    document.documentElement.style.setProperty('--vt-duration', `${toggles.transitionDuration}s`)
  }, [toggles.transitionDuration])

  // Mirrors into the plain-JS side-channel debugFlags (see
  // view-transition-state.ts) rather than a CSS variable — the reader here
  // is _app.tsx's router-events code, not CSS.
  useEffect(() => {
    if (!isDev) return
    debugFlags.enableOffscreenAnimation = toggles.enableOffscreenAnimation
  }, [toggles.enableOffscreenAnimation])

  // Classes on <html> rather than a CSS variable — the reader is a set of
  // whole CSS rules (globals.css's vt-size-morph-* blocks) that need to be
  // on or off entirely, not a single interpolated value. Deliberately NOT
  // `if (!isDev) return` like the debug effects above: sizeMorph is a real
  // shipped design choice (its default is 'cover'), so this must apply in
  // production too — where `toggles` is just DEFAULTS, making this a
  // one-shot class-add on mount. Safe post-hydration: the class only
  // affects view-transition pseudo-elements, which never exist before the
  // first navigation.
  useEffect(() => {
    document.documentElement.classList.toggle('vt-size-morph-cover', toggles.sizeMorph === 'cover')
    document.documentElement.classList.toggle('vt-size-morph-contain', toggles.sizeMorph === 'contain')
  }, [toggles.sizeMorph])

  // Anchored in dvh/dvw (dynamic viewport units), not vh/vw or a plain
  // fixed+bottom-4 — on mobile, the browser's own address/tab bar shows and
  // hides as you scroll, which resizes the *static* viewport but not the
  // *dynamic* one. A bottom-4-in-a-100vh world can end up positioned behind
  // that chrome (or requiring a scroll to reach); 100dvh/100dvw always
  // reflect whatever's actually visible right now, so the anchor point
  // never hides behind the browser's own UI.
  const anchorClass = 'fixed z-50'
  const anchorStyle = { bottom: '2dvh', right: '2dvw' } as const

  return (
    <DesignToggleContext.Provider value={toggles}>
      {children}
      {isDev && toggles.panelCollapsed && (
        <button
          onClick={() => update({ panelCollapsed: false })}
          title="Open design A/B panel"
          aria-label="Open design A/B panel"
          className={`${anchorClass} w-10 h-10 rounded-full border bg-back-light dark:bg-back-dark shadow-lg
                      flex items-center justify-center text-muted-light dark:text-muted-dark
                      hover:text-primary-light dark:hover:text-primary-dark duration-150`}
          style={anchorStyle}
        >
          <i className="fas fa-sliders text-sm" />
        </button>
      )}
      {isDev && !toggles.panelCollapsed && (
        <div
          className={`${anchorClass} rounded-xl border bg-back-light dark:bg-back-dark
                      shadow-lg p-4 font-sans flex flex-col gap-3 w-64 max-h-[92dvh] overflow-y-auto`}
          style={anchorStyle}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-faint-light dark:text-faint-dark uppercase tracking-wide">
              Dev: design A/B
            </p>
            <button
              onClick={() => update({ panelCollapsed: true })}
              title="Collapse"
              aria-label="Collapse panel"
              className="text-faint-light dark:text-faint-dark hover:text-primary-light dark:hover:text-primary-dark duration-150"
            >
              <i className="fas fa-xmark" />
            </button>
          </div>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Status tag</span>
            <button
              onClick={() => update({ statusStyle: toggles.statusStyle === 'circle' ? 'border' : 'circle' })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.statusStyle}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Card style</span>
            <button
              onClick={() => update({ cardStyle: toggles.cardStyle === 'border' ? 'divider' : 'border' })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.cardStyle}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Share icon</span>
            <button
              onClick={() => {
                const order: ShareIconStyle[] = ['branch-outline', 'branch', 'nodes', 'upload']
                const next = order[(order.indexOf(toggles.shareIcon) + 1) % order.length]
                update({ shareIcon: next })
              }}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.shareIcon}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Meta order</span>
            <button
              onClick={() => update({ metaOrder: toggles.metaOrder === 'date-first' ? 'owner-first' : 'date-first' })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.metaOrder === 'date-first' ? 'date first' : 'owner first'}
            </button>
          </label>
          <label className="flex flex-col gap-1.5 text-base">
            <span className="flex items-center justify-between">
              <span>Row spacing +</span>
              <span className="text-sm text-faint-light dark:text-faint-dark">{toggles.spacing}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={150}
              step={10}
              value={toggles.spacing}
              onChange={(e) => update({ spacing: Number(e.target.value) })}
              className="w-full accent-link2-light dark:accent-link2-dark"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Hide dead mirrors</span>
            <button
              onClick={() => update({ hideUnavailableMirrors: !toggles.hideUnavailableMirrors })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.hideUnavailableMirrors ? 'on' : 'off'}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Header divider</span>
            <button
              onClick={() => update({ headerDivider: nextChrome(toggles.headerDivider) })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.headerDivider}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Page title (Posts/…)</span>
            <button
              onClick={() => update({ pageTitle: nextChrome(toggles.pageTitle) })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.pageTitle}
            </button>
          </label>
          <label className="flex flex-col gap-1.5 text-base">
            <span className="flex items-center justify-between">
              <span>Transition duration</span>
              <span className="text-sm text-faint-light dark:text-faint-dark">{toggles.transitionDuration}s</span>
            </span>
            <input
              type="range"
              min={0.3}
              max={10}
              step={0.1}
              value={toggles.transitionDuration}
              onChange={(e) => update({ transitionDuration: Number(e.target.value) })}
              className="w-full accent-link2-light dark:accent-link2-dark"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Enable offscreen animation</span>
            <button
              onClick={() => update({ enableOffscreenAnimation: !toggles.enableOffscreenAnimation })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.enableOffscreenAnimation ? 'on' : 'off'}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Size morph</span>
            <button
              onClick={() => {
                const order: DesignToggles['sizeMorph'][] = ['off', 'cover', 'contain']
                const next = order[(order.indexOf(toggles.sizeMorph) + 1) % order.length]
                update({ sizeMorph: next })
              }}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.sizeMorph}
            </button>
          </label>
          <label className="flex items-center justify-between gap-2 text-base">
            <span>Font</span>
            <button
              onClick={() => update({ fontFamily: toggles.fontFamily === 'open-sans' ? 'inter' : 'open-sans' })}
              className="border rounded-full px-3 py-1 text-sm capitalize hover:bg-back-secondary-light
                         dark:hover:bg-back-secondary-dark"
            >
              {toggles.fontFamily === 'open-sans' ? 'Open Sans' : 'Inter'}
            </button>
          </label>
          <label className="flex flex-col gap-1.5 text-base">
            <span className="flex items-center justify-between">
              <span>Tag colors</span>
              <span className="text-sm text-faint-light dark:text-faint-dark">
                {toggles.tagColorMuting === 0
                  ? 'colored'
                  : toggles.tagColorMuting === 100
                    ? 'muted'
                    : `${toggles.tagColorMuting}% muted`}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={toggles.tagColorMuting}
              onChange={(e) => update({ tagColorMuting: Number(e.target.value) })}
              className="w-full accent-link2-light dark:accent-link2-dark"
            />
          </label>
        </div>
      )}
    </DesignToggleContext.Provider>
  )
}
