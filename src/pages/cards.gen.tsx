import { GetStaticProps } from 'next'
import fs from 'fs'
import {
  getPublicProjects,
  sortProjects,
  formatProjectDate,
  getProjectById,
  ProjectMeta,
} from '../project'

// Build-time generator for the GitHub profile-README cards. Emits compressed
// WEBP in both themes to public/cards/, embedded in the README via <picture>
// so they refresh on every site build. Kept as a `.gen` page (renders nothing;
// the .gen.html is stripped on deploy) so it runs inside Next's build with
// direct access to the real content modules — like feed.gen / sitemap.gen.
const CardsGen = () => null

// Projects that live in the site's log but should NOT be promoted in the
// cards — WIP products we don't want to over-expose, contract work, etc.
const PROMO_BLACKLIST = new Set<string>(['startbounty', 'dogcat-fund'])

// The "tools you can actually use" card — a curated, adoptable subset. STARK
// is deliberately left OUT (it's already the flagship in the projects card),
// so this card gives the *under-exposed* usable tools their own spotlight.
const TOOLS_IDS = [
  'ios-localizer',
  'fastapi-ws-docs-demo',
  'swiftytranslate',
  'anyobservableobject',
  'rpi-networking',
  'python-app-architecture-demo',
  'raspi-gpio',
  'rpi-reactive-gpio',
]

// ---- palette per theme ---------------------------------------------------
type Palette = { bg: string; title: string; muted: string; blurb: string; accent: string; divider: string }
const THEMES: Record<'light' | 'dark', Palette> = {
  light: { bg: '#ffffff', title: '#1f2328', muted: '#656d76', blurb: '#3b424a', accent: '#0969da', divider: '#d0d7de' },
  dark: { bg: '#0d1117', title: '#e6edf3', muted: '#8b949e', blurb: '#c9d1d9', accent: '#58a6ff', divider: '#30363d' },
}

// ---- geometry (strip-like, NOT 16:9 — see the README aspect-ratio note) --
const W = 1200
const PAD = 44
const GAP = 44
const COL_W = (W - PAD * 2 - GAP) / 2
const HEAD_Y = 56
const ROW_TOP = 98

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// SVG has no wrapping — greedily pack words to `maxLines` by an average glyph
// advance (~0.5em for this sans), ellipsising the last line if text remains.
function wrapText(text: string, fontPx: number, maxW: number, maxLines: number): string[] {
  const cpl = Math.max(4, Math.floor(maxW / (fontPx * 0.5)))
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  let truncated = false
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w
    if (trial.length <= cpl) {
      cur = trial
    } else {
      if (cur) lines.push(cur)
      cur = w
      if (lines.length >= maxLines) {
        truncated = true
        cur = ''
        break
      }
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  if (truncated && lines.length) {
    let last = lines[lines.length - 1]
    while (`${last}…`.length > cpl && last.length) last = last.slice(0, -1)
    lines[lines.length - 1] = `${last.trimEnd()}…`
  }
  return lines
}

const single = (s: string, fontPx: number, maxW: number) => {
  const cpl = Math.max(4, Math.floor(maxW / (fontPx * 0.52)))
  return s.length <= cpl ? s : `${s.slice(0, cpl - 1).trimEnd()}…`
}

type Row = { title?: string; meta?: string; body: string; tags?: string }

function renderColumn(x: number, heading: string, rows: Row[], rowH: number, p: Palette, cw: number = COL_W): string {
  const parts: string[] = [
    `<text x="${x}" y="${HEAD_Y}" fill="${p.accent}" font-size="21" font-weight="700" letter-spacing="1.5">${esc(heading.toUpperCase())}</text>`,
    `<line x1="${x}" y1="${HEAD_Y + 16}" x2="${x + cw}" y2="${HEAD_Y + 16}" stroke="${p.divider}" stroke-width="1.5"/>`,
  ]
  rows.forEach((r, i) => {
    const y = ROW_TOP + i * rowH
    let cursor = y
    if (r.title) {
      parts.push(
        `<text x="${x}" y="${cursor + 22}" fill="${p.title}" font-size="24" font-weight="700">${esc(single(r.title, 24, cw - 120))}</text>`,
      )
      if (r.meta)
        parts.push(`<text x="${x + cw}" y="${cursor + 20}" fill="${p.muted}" font-size="15" text-anchor="end">${esc(r.meta)}</text>`)
      cursor += 30
    }
    const lines = wrapText(r.body, 16.5, cw, r.title ? 2 : 3)
    lines.forEach((ln, li) => {
      parts.push(`<text x="${x}" y="${cursor + 18 + li * 23}" fill="${r.title ? p.blurb : p.title}" font-size="16.5">${esc(ln)}</text>`)
    })
    cursor += lines.length * 23 + 6
    if (!r.title && r.meta) parts.push(`<text x="${x}" y="${cursor + 12}" fill="${p.muted}" font-size="14">${esc(r.meta)}</text>`)
    if (r.tags) parts.push(`<text x="${x}" y="${cursor + 14}" fill="${p.muted}" font-size="14" letter-spacing="0.3">${esc(r.tags)}</text>`)
  })
  return parts.join('\n')
}

function frame(H: number, p: Palette, left: string, right = '', divider = true): string {
  const mid = divider
    ? `<line x1="${W / 2}" y1="${PAD}" x2="${W / 2}" y2="${H - PAD}" stroke="${p.divider}" stroke-width="1" opacity="0.6"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" rx="14" fill="${p.bg}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="none" stroke="${p.divider}" stroke-width="1.5"/>
  ${left}
  ${mid}
  ${right}
  <text x="${W - PAD}" y="${H - 16}" fill="${p.muted}" font-size="13" text-anchor="end">→ markparker.me</text>
</svg>`
}

const projectRow = (pj: ProjectMeta): Row => ({
  title: pj.title,
  meta: formatProjectDate(pj),
  body: pj.blurb,
  tags: pj.tags.slice(0, 4).join('  ·  '),
})

// Temporary curated featured set (flagships + a placeholder) instead of the
// interest-sorted top, while most other work is WIP/unpublished.
const FEATURED_IDS = ['majordom', 'stark']
const COMING_SOON: Row = { title: 'Coming soon', body: "New work in progress — I'll surface it here as it ships.", tags: '' }

function buildProjectsCard(theme: 'light' | 'dark'): string {
  const p = THEMES[theme]
  const pool = getPublicProjects().filter((pj) => !PROMO_BLACKLIST.has(pj.id))
  const featured = FEATURED_IDS.map((id) => getProjectById(id))
    .filter((x): x is ProjectMeta => !!x)
    .map(projectRow)
  featured.push(COMING_SOON)
  const featuredIds = new Set(FEATURED_IDS)
  const recent = sortProjects(pool, 'created').filter((pj) => !featuredIds.has(pj.id)).slice(0, 4)
  const rowH = 108
  const rows = Math.max(featured.length, recent.length)
  const H = ROW_TOP + rows * rowH + PAD - 20
  return frame(
    H,
    p,
    renderColumn(PAD, 'Featured projects', featured, rowH, p),
    renderColumn(PAD + COL_W + GAP, 'Recent work', recent.map(projectRow), rowH, p),
  )
}

function buildToolsCard(theme: 'light' | 'dark'): string {
  const p = THEMES[theme]
  const tools = TOOLS_IDS.map((id) => getProjectById(id)).filter((x): x is ProjectMeta => !!x)
  const half = Math.ceil(tools.length / 2)
  const rowH = 108
  const H = ROW_TOP + half * rowH + PAD - 20
  return frame(
    H,
    p,
    renderColumn(PAD, 'Tools you can use', tools.slice(0, half).map(projectRow), rowH, p),
    renderColumn(PAD + COL_W + GAP, 'more open source', tools.slice(half).map(projectRow), rowH, p),
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const sharp = (await import('sharp')).default
  const dir = `${process.cwd()}/public/cards`
  fs.mkdirSync(dir, { recursive: true })

  const cards: Record<string, (t: 'light' | 'dark') => string> = {
    projects: buildProjectsCard,
    tools: buildToolsCard,
    // posts card skipped for now — no public notes and the blog isn't
    // promotion-ready yet. Re-add buildPostsCard here to bring it back.
  }

  for (const [name, build] of Object.entries(cards)) {
    for (const theme of ['light', 'dark'] as const) {
      await sharp(Buffer.from(build(theme)), { density: 144 })
        .resize(W * 2)
        .webp({ quality: 78, effort: 6 })
        .toFile(`${dir}/${name}-${theme}.webp`)
    }
  }
  console.log(`generated cards: ${Object.keys(cards).join(', ')} (light/dark webp)`)
  return { props: {} }
}

export default CardsGen
