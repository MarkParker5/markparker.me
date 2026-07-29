import { GetStaticProps } from 'next'
import fs from 'fs'
import {
  getPublicProjects,
  sortProjects,
  formatProjectDate,
  ProjectMeta,
} from '../project'

// Build-time generator for the GitHub profile-README project cards. Emits
// compressed WEBP in both themes to public/cards/, so the README can embed
// them via <picture> and they stay fresh on every site build — no manual
// README edits. Kept as a `.gen` page (renders nothing; the .gen.html is
// stripped on deploy) so it runs inside Next's build with direct access to
// the real projects module, exactly like feed.gen / sitemap.gen.
const CardsGen = () => null

const PER_COLUMN = 4

// ---- palette per theme ---------------------------------------------------
type Palette = {
  bg: string
  panel: string
  title: string
  muted: string
  blurb: string
  accent: string
  divider: string
}
const THEMES: Record<'light' | 'dark', Palette> = {
  light: {
    bg: '#ffffff',
    panel: '#f6f8fa',
    title: '#1f2328',
    muted: '#656d76',
    blurb: '#3b424a',
    accent: '#0969da',
    divider: '#d0d7de',
  },
  dark: {
    bg: '#0d1117',
    panel: '#161b22',
    title: '#e6edf3',
    muted: '#8b949e',
    blurb: '#c9d1d9',
    accent: '#58a6ff',
    divider: '#30363d',
  },
}

// ---- geometry (strip-like, NOT 16:9 — see the README aspect-ratio note) --
const W = 1200
const PAD = 44
const GAP = 44
const COL_W = (W - PAD * 2 - GAP) / 2
const HEAD_Y = 56
const ROW_TOP = 96
const ROW_H = 82
const H = ROW_TOP + PER_COLUMN * ROW_H + PAD - 12

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// SVG has no text wrapping/ellipsis — approximate width by average glyph
// advance (~0.53em for this sans stack) and hard-truncate with an ellipsis.
const fit = (s: string, fontPx: number, maxW: number) => {
  const max = Math.floor(maxW / (fontPx * 0.53))
  return s.length <= max ? s : s.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

function column(x: number, heading: string, items: ProjectMeta[], p: Palette): string {
  const parts: string[] = []
  parts.push(
    `<text x="${x}" y="${HEAD_Y}" fill="${p.accent}" font-size="21" font-weight="700" letter-spacing="1.5">${esc(
      heading.toUpperCase(),
    )}</text>`,
  )
  parts.push(
    `<line x1="${x}" y1="${HEAD_Y + 16}" x2="${x + COL_W}" y2="${HEAD_Y + 16}" stroke="${p.divider}" stroke-width="1.5"/>`,
  )
  items.forEach((it, i) => {
    const y = ROW_TOP + i * ROW_H
    const date = formatProjectDate(it)
    const tags = it.tags.slice(0, 4).join('  ·  ')
    parts.push(
      `<text x="${x}" y="${y + 22}" fill="${p.title}" font-size="25" font-weight="700">${esc(
        fit(it.title, 25, COL_W - 130),
      )}</text>`,
      `<text x="${x + COL_W}" y="${y + 20}" fill="${p.muted}" font-size="15" text-anchor="end">${esc(date)}</text>`,
      `<text x="${x}" y="${y + 46}" fill="${p.blurb}" font-size="16.5">${esc(fit(it.blurb, 16.5, COL_W))}</text>`,
      `<text x="${x}" y="${y + 68}" fill="${p.muted}" font-size="14" letter-spacing="0.3">${esc(tags)}</text>`,
    )
  })
  return parts.join('\n')
}

function buildSvg(top: ProjectMeta[], recent: ProjectMeta[], theme: 'light' | 'dark'): string {
  const p = THEMES[theme]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" rx="14" fill="${p.bg}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="none" stroke="${p.divider}" stroke-width="1.5"/>
  ${column(PAD, 'Top projects', top, p)}
  <line x1="${W / 2}" y1="${PAD}" x2="${W / 2}" y2="${H - PAD}" stroke="${p.divider}" stroke-width="1" opacity="0.6"/>
  ${column(PAD + COL_W + GAP, 'Recent work', recent, p)}
  <text x="${W - PAD}" y="${H - 16}" fill="${p.muted}" font-size="13" text-anchor="end">markparker.me</text>
</svg>`
}

export const getStaticProps: GetStaticProps = async () => {
  const sharp = (await import('sharp')).default

  const all = getPublicProjects()
  const top = sortProjects(all, 'interesting').slice(0, PER_COLUMN)
  const topIds = new Set(top.map((p) => p.id))
  // Dedup: a project already in the Top column never repeats under Recent.
  const recent = sortProjects(all, 'updated')
    .filter((p) => !topIds.has(p.id))
    .slice(0, PER_COLUMN)

  const dir = `${process.cwd()}/public/cards`
  fs.mkdirSync(dir, { recursive: true })

  for (const theme of ['light', 'dark'] as const) {
    const svg = buildSvg(top, recent, theme)
    // Render at 2x for retina crispness, then encode as compressed WEBP.
    await sharp(Buffer.from(svg), { density: 144 })
      .resize(W * 2)
      .webp({ quality: 78, effort: 6 })
      .toFile(`${dir}/projects-${theme}.webp`)
  }
  console.log('generated project cards (light/dark webp)')

  return { props: {} }
}

export default CardsGen
