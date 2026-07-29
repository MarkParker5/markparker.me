import { GetStaticProps } from 'next'
import fs from 'fs'

// Build-time generator for the cross-repo promo banners embedded in many
// repos' READMEs (see the repo→banner map). Emits compressed WEBP strips in
// both themes to public/banners/, so the copy can be updated for every repo at
// once by rebuilding the site. Strips are kept wide-and-short (~5:1) so they
// read as a billboard line, not a viewport-filling hero.
const BannersGen = () => null

const W = 1280

type Palette = { bg: string; panel: string; title: string; muted: string; body: string; accent: string; onAccent: string; divider: string }
const base = (theme: 'light' | 'dark') =>
  theme === 'light'
    ? { bg: '#ffffff', panel: '#f6f8fa', title: '#1f2328', muted: '#656d76', body: '#3b424a', divider: '#d0d7de', onAccent: '#ffffff' }
    : { bg: '#0d1117', panel: '#161b22', title: '#e6edf3', muted: '#8b949e', body: '#c9d1d9', divider: '#30363d', onAccent: '#0d1117' }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function svg(H: number, inner: string, p: Palette): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" rx="12" fill="${p.bg}"/>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="11" fill="none" stroke="${p.divider}" stroke-width="2"/>
  ${inner}
</svg>`
}

// A row of centered labels split by slanted "/" dividers — the "/ / /" look.
function angledCells(labels: string[], x: number, y: number, w: number, h: number, p: Palette, fontPx = 30): string {
  const n = labels.length
  const cw = w / n
  const skew = h * 0.34
  const parts: string[] = []
  for (let i = 1; i < n; i++) {
    const bx = x + i * cw
    parts.push(`<line x1="${bx - skew / 2}" y1="${y + h}" x2="${bx + skew / 2}" y2="${y}" stroke="${p.accent}" stroke-width="3" opacity="0.85"/>`)
  }
  labels.forEach((l, i) => {
    const cx = x + i * cw + cw / 2
    parts.push(`<text x="${cx}" y="${y + h / 2 + fontPx * 0.35}" fill="${p.title}" font-size="${fontPx}" font-weight="800" letter-spacing="1" text-anchor="middle">${esc(l)}</text>`)
  })
  return parts.join('\n')
}

function ctaPill(xRight: number, cy: number, text: string, p: Palette): string {
  const w = text.length * 12.5 + 44
  const h = 52
  const x = xRight - w
  return `<rect x="${x}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${p.accent}"/>
  <text x="${x + w / 2}" y="${cy + 7}" fill="${p.onAccent}" font-size="21" font-weight="700" text-anchor="middle">${esc(text)}</text>`
}

// ---- 1. MajorDom ecosystem ----------------------------------------------
function majordom(theme: 'light' | 'dark'): string {
  const p = { ...base(theme), accent: '#10b981', onAccent: '#052e1f' } as Palette
  const H = 230
  const inner = `
  <text x="48" y="86" fill="${p.accent}" font-size="24" font-weight="800" letter-spacing="3">PART OF MAJORDOM</text>
  <text x="48" y="132" fill="${p.title}" font-size="34" font-weight="800">The private, offline-first smart home</text>
  <text x="48" y="172" fill="${p.body}" font-size="22">that's actually smart — one hub, no cloud, your data stays home.</text>
  ${ctaPill(W - 48, H / 2, 'Explore MajorDom →', p)}`
  return svg(H, inner, p)
}

// ---- 2. Parker Industries (company) — thin "/ / /" strip -----------------
function company(theme: 'light' | 'dark'): string {
  const p = { ...base(theme), accent: '#0969da' } as Palette
  const H = 176
  const inner = `
  <text x="${W / 2}" y="46" fill="${p.muted}" font-size="17" text-anchor="middle" letter-spacing="0.5">made by Parker Industries — currently building</text>
  ${angledCells(['MAJORDOM', 'STARTBOUNTY', 'ABOUT US'], 40, 66, W - 80, 86, p, 30)}`
  return svg(H, inner, p)
}

// ---- 3. Personal / random repo — flagship overview + trailing link -------
function flagship(theme: 'light' | 'dark'): string {
  const p = { ...base(theme), accent: '#0969da' } as Palette
  const H = 220
  const inner = `
  <text x="${W / 2}" y="44" fill="${p.muted}" font-size="17" text-anchor="middle" letter-spacing="0.5">a Mark Parker project — a few more I'm proud of</text>
  ${angledCells(['MAJORDOM', 'STARK', 'STARTBOUNTY'], 40, 62, W - 80, 88, p, 28)}
  <text x="${W / 2}" y="196" fill="${p.accent}" font-size="20" font-weight="700" text-anchor="middle">see everything → markparker.me</text>`
  return svg(H, inner, p)
}

// ---- 4. Helpful tool — coffee CTA (reciprocity + self-appraisal) ---------
function coffee(theme: 'light' | 'dark'): string {
  const p = { ...base(theme), accent: '#d97706', onAccent: '#2a1500' } as Palette
  const H = 214
  const inner = `
  <text x="48" y="80" fill="${p.title}" font-size="32" font-weight="800">Did this solve your problem?</text>
  <text x="48" y="120" fill="${p.body}" font-size="21">It's free — but it wasn't free to make. If it saved you time,</text>
  <text x="48" y="150" fill="${p.body}" font-size="21">that's worth a coffee, right?</text>
  ${ctaPill(W - 48, H / 2, '☕ Buy me one →', p)}`
  return svg(H, inner, p)
}

export const getStaticProps: GetStaticProps = async () => {
  const sharp = (await import('sharp')).default
  const dir = `${process.cwd()}/public/banners`
  fs.mkdirSync(dir, { recursive: true })

  const banners: Record<string, (t: 'light' | 'dark') => string> = {
    majordom,
    company,
    flagship,
    coffee,
  }
  for (const [name, build] of Object.entries(banners)) {
    for (const theme of ['light', 'dark'] as const) {
      await sharp(Buffer.from(build(theme)), { density: 144 })
        .resize(W * 2)
        .webp({ quality: 80, effort: 6 })
        .toFile(`${dir}/${name}-${theme}.webp`)
    }
  }
  console.log('generated banners: majordom, company, flagship, coffee (light/dark webp)')
  return { props: {} }
}

export default BannersGen
