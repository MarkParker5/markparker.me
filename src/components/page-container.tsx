import { PropsWithChildren } from 'react'

// The width every card/heading/text column actually reads at — shared
// between the homepage's content column (index.tsx) and every content
// page's single column (article-layout.tsx). Both used to size themselves
// independently (the homepage's column was `flex-1`, filling whatever
// flex space was left next to the 26rem profile sidebar — which comes out
// to ~39rem, narrower than this 42rem, on every viewport this site
// actually renders at) — a view-transition morph between two boxes of
// different widths reflows text into different line breaks and
// stretches/crops images differently on each side, reading as a messy
// jump independent of the morph animation itself. Same class string, at a
// FIXED width on both ends (not just capped, see index.tsx), means the
// box genuinely doesn't change size for a shared card.
export const CONTENT_MAX_WIDTH_CLASS = 'max-w-2xl'
const CONTENT_MAX_WIDTH_REM = 42 // max-w-2xl

// Single shared outer width/gutter for every page — homepage and every
// subpage (article-layout.tsx) render inside this, so the page edges align
// instead of each page picking its own ad hoc max-width. Sized to
// comfortably fit the homepage's widest row: the 26rem profile sidebar +
// a 2.5rem gap + the full CONTENT_MAX_WIDTH_REM column, plus this
// container's own 2.5rem-per-side gutter (`sm:px-10`) — 26 + 2.5 + 42 +
// 5 = 75.5rem, so 75rem (the previous value) was JUST short of fitting
// the homepage's column at its real 42rem width; 78rem clears it with
// room to spare. Content pages don't notice the difference — their own
// column is independently centered at CONTENT_MAX_WIDTH_REM regardless of
// how much wider the outer page container is around it.
export const PAGE_MAX_WIDTH = `${26 + 2.5 + CONTENT_MAX_WIDTH_REM + 5 + 2.5}rem`

export const PageContainer = ({ children }: PropsWithChildren<unknown>) => (
  <div className="mx-auto px-6 sm:px-10" style={{ maxWidth: PAGE_MAX_WIDTH }}>
    {children}
  </div>
)
