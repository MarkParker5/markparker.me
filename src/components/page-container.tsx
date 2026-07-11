import { PropsWithChildren } from 'react'

// Single shared outer width/gutter for every page — homepage and every
// subpage (article-layout.tsx) render inside this, so the page edges align
// instead of each page picking its own ad hoc max-width.
export const PAGE_MAX_WIDTH = '75rem'

export const PageContainer = ({ children }: PropsWithChildren<unknown>) => (
  <div className="mx-auto px-6 sm:px-10" style={{ maxWidth: PAGE_MAX_WIDTH }}>
    {children}
  </div>
)
