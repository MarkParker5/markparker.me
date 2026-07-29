import { GetStaticProps } from 'next'
import fs from 'fs'

// Build-time generator for the cross-repo promo banners embedded in many
// repos' READMEs. Emits compressed WEBP strips in both themes to
// public/banners/, so copy/art can be updated for every repo at once by
// rebuilding the site. Wide-and-short (~5:1) so they read as a billboard line,
// not a viewport-filling hero.
const BannersGen = () => null

const W = 1280
// MajorDom brand orange (--md-accent-fg-color at docs.majordom.io).
const MAJORDOM_ORANGE = '#ff6e42'

type Palette = { bg: string; panel: string; title: string; muted: string; body: string; accent: string; onAccent: string; divider: string }
const base = (theme: 'light' | 'dark') =>
  theme === 'light'
    ? { bg: '#ffffff', panel: '#f6f8fa', title: '#1f2328', muted: '#656d76', body: '#3b424a', divider: '#d0d7de', onAccent: '#ffffff' }
    : { bg: '#0d1117', panel: '#161b22', title: '#e6edf3', muted: '#8b949e', body: '#c9d1d9', divider: '#30363d', onAccent: '#0d1117' }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Short, bold right-arrow (shaft + chevron head), drawn — not a thin glyph.
function arrow(cx: number, cy: number, size: number, color: string, w = 4.5): string {
  const half = size / 2
  const hd = size * 0.36
  return `<path d="M${cx - half} ${cy} H${cx + half} M${cx + half - hd} ${cy - hd} L${cx + half} ${cy} L${cx + half - hd} ${cy + hd}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
}

// CTA = label + a thin arrow-in-circle (à la parker-industries.org), no pill.
function cta(xRight: number, cy: number, label: string, color: string, p: Palette): string {
  const r = 30
  const circleCx = xRight - r
  const label_x = circleCx - r - 20
  return `<text x="${label_x}" y="${cy + 8}" fill="${p.title}" font-size="24" font-weight="700" text-anchor="end">${esc(label)}</text>
  <circle cx="${circleCx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>
  ${arrow(circleCx, cy, r * 0.92, color, 4)}`
}

// Bottom-right "→ markparker.me" with the short bold arrow before it.
function mpLink(yBaseline: number, p: Palette): string {
  const text = 'markparker.me'
  const tx = W - 44
  const ax = tx - text.length * 11.5 - 22
  return `${arrow(ax, yBaseline - 6, 26, p.accent, 4.5)}
  <text x="${tx}" y="${yBaseline}" fill="${p.accent}" font-size="21" font-weight="800" text-anchor="end">${esc(text)}</text>`
}

// A full-bleed row of variable-width parallelogram cells (the "/ / /" look).
// Project cells hold a 16:9 hero image (no crop, no overlay/label — the art
// carries its own branding); a trailing CTA cell is a solid accent tile with
// an optional label + a circle-arrow. Its LEFT edge slants like every other
// divider, so the CTA is part of the "/ / /" rhythm, not tacked on.
type Cell = { img?: string; w: number; cta?: boolean; label?: string }
function cellRow(cells: Cell[], Y0: number, h: number, skew: number, p: Palette): string {
  const bounds: number[] = [0]
  let acc = 0
  for (const c of cells) { acc += c.w; bounds.push(acc) }
  const n = cells.length
  const defs: string[] = []
  const back: string[] = []
  const shapes: string[] = []
  cells.forEach((c, i) => {
    const x0 = bounds[i]
    const x1 = bounds[i + 1]
    // Every edge slants the same "/" — including the two outer ends. The
    // overhang past x=0 / x=W is clipped by the rounded frame.
    const lTop = x0 + skew / 2
    const lBot = x0 - skew / 2
    const rTop = x1 + skew / 2
    const rBot = x1 - skew / 2
    const poly = `${lTop},${Y0} ${rTop},${Y0} ${rBot},${Y0 + h} ${lBot},${Y0 + h}`
    const cx = (x0 + x1) / 2
    const cy = Y0 + h / 2

    // First/last cells: a faded full-rect backdrop so the triangle the outer
    // slant would otherwise leave empty stays filled — the slant reads at the
    // ends "into opacity" while the banner keeps its rectangular shape.
    if (i === 0 || i === n - 1) {
      if (c.img) {
        back.push(`<image href="${c.img}" x="${x0 - skew}" y="${Y0}" width="${x1 - x0 + 2 * skew}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="0.38"/>`)
      } else {
        back.push(`<rect x="${x0 - skew}" y="${Y0}" width="${x1 - x0 + 2 * skew}" height="${h}" fill="${p.accent}" opacity="0.5"/>`)
      }
    }

    if (c.img) {
      const bx = Math.min(lTop, lBot)
      const bw = Math.max(rTop, rBot) - bx
      const id = `clip${i}`
      defs.push(`<clipPath id="${id}"><polygon points="${poly}"/></clipPath>`)
      shapes.push(`<g clip-path="url(#${id})"><image href="${c.img}" x="${bx}" y="${Y0}" width="${bw}" height="${h}" preserveAspectRatio="xMidYMid slice"/></g>`)
    } else {
      shapes.push(`<polygon points="${poly}" fill="${p.accent}"/>`)
      const r = 22
      if (c.label) {
        shapes.push(`<text x="${cx - r - 12}" y="${cy + 9}" fill="${p.onAccent}" font-size="26" font-weight="800" letter-spacing="1" text-anchor="end">${esc(c.label)}</text>`)
        shapes.push(`<circle cx="${cx + 30}" cy="${cy}" r="${r}" fill="none" stroke="${p.onAccent}" stroke-width="3"/>${arrow(cx + 30, cy, r * 1.3, p.onAccent, 3.6)}`)
      } else {
        shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r + 2}" fill="none" stroke="${p.onAccent}" stroke-width="3"/>${arrow(cx, cy, r * 1.4, p.onAccent, 4)}`)
      }
    }
    // Divider stroke on the "/" — solid interior, faded on the two ends.
    const op = i === 0 ? 0.45 : 1
    shapes.push(`<line x1="${x0 - skew / 2}" y1="${Y0 + h}" x2="${x0 + skew / 2}" y2="${Y0}" stroke="${p.bg}" stroke-width="5" opacity="${op}"/>`)
    if (i === n - 1) shapes.push(`<line x1="${x1 - skew / 2}" y1="${Y0 + h}" x2="${x1 + skew / 2}" y2="${Y0}" stroke="${p.bg}" stroke-width="5" opacity="0.45"/>`)
  })
  return `<defs>${defs.join('')}</defs>${back.join('\n')}${shapes.join('\n')}`
}

// Project cells are 16:9 (uncropped); the CTA tile takes whatever width is left.
const P169 = (img: string, h: number): Cell => ({ img, w: Math.round((h * 16) / 9) })

function svg(H: number, inner: string, p: Palette): string {
  // Round the whole banner (so full-bleed image cells don't poke square
  // corners past the radius) and draw the border stroke ON TOP of the content.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">
  <defs><clipPath id="frameclip"><rect width="${W}" height="${H}" rx="12"/></clipPath></defs>
  <g clip-path="url(#frameclip)">
    <rect width="${W}" height="${H}" fill="${p.bg}"/>
    ${inner}
  </g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="11" fill="none" stroke="${p.divider}" stroke-width="2"/>
</svg>`
}

type Assets = { majordom: string; startbounty: string; stark: string }

// ---- 1. MajorDom ecosystem (brand orange, circle-arrow CTA) --------------
function majordom(theme: 'light' | 'dark'): string {
  const p = { ...base(theme), accent: MAJORDOM_ORANGE, onAccent: '#2a1000' } as Palette
  const H = 230
  const inner = `
  <text x="48" y="86" fill="${p.accent}" font-size="24" font-weight="800" letter-spacing="3">PART OF MAJORDOM</text>
  <text x="48" y="132" fill="${p.title}" font-size="36" font-weight="800">The next-gen smart home</text>
  <text x="48" y="172" fill="${p.body}" font-size="22">open source • local-first • user-friendly • truly smart</text>
  ${cta(W - 44, H / 2, 'Explore MajorDom', p.accent, p)}`
  return svg(H, inner, p)
}

// ---- 2. Parker Industries (company) — 2 projects @16:9 + ABOUT US tile ---
function company(theme: 'light' | 'dark', a: Assets): string {
  const p = { ...base(theme), accent: '#0969da' } as Palette
  const h = 168
  const projW = Math.round((h * 16) / 9)
  const rest = W - projW * 2
  const H = 60 + h + 20
  const inner = `
  <text x="${W / 2}" y="42" fill="${p.muted}" font-size="17" text-anchor="middle" letter-spacing="0.5">made by Parker Industries · currently building:</text>
  ${cellRow([P169(a.majordom, h), P169(a.startbounty, h), { w: rest, cta: true, label: 'ABOUT US' }], 60, h, 44, p)}`
  return svg(H, inner, p)
}

// ---- 3. Personal / random repo — 3 projects @16:9 + VISIT tile ----------
function flagship(theme: 'light' | 'dark', a: Assets): string {
  const p = { ...base(theme), accent: '#0969da' } as Palette
  const h = 168
  const projW = Math.round((h * 16) / 9)
  const rest = W - projW * 3
  const H = 58 + h + 20
  const inner = `
  <text x="44" y="42" fill="${p.muted}" font-size="17" letter-spacing="0.5">a Mark Parker project · a few more I'm proud of</text>
  ${cellRow([P169(a.majordom, h), P169(a.stark, h), P169(a.startbounty, h), { w: rest, cta: true, label: 'VISIT' }], 58, h, 44, p)}`
  return svg(H, inner, p)
}

// ---- 4. Helpful tool — coffee CTA (reciprocity + self-appraisal) --------
function coffee(theme: 'light' | 'dark'): string {
  const p = { ...base(theme), accent: '#d97706', onAccent: '#2a1500' } as Palette
  const H = 214
  const inner = `
  <text x="48" y="80" fill="${p.title}" font-size="32" font-weight="800">Did this solve your problem?</text>
  <text x="48" y="120" fill="${p.body}" font-size="21">It's free — but it wasn't free to make. If it saved you time,</text>
  <text x="48" y="150" fill="${p.body}" font-size="21">that's worth a coffee, right?</text>
  ${cta(W - 44, H / 2, 'Get me a coffee', p.accent, p)}`
  return svg(H, inner, p)
}

export const getStaticProps: GetStaticProps = async () => {
  const sharp = (await import('sharp')).default
  const dir = `${process.cwd()}/public/banners`
  fs.mkdirSync(dir, { recursive: true })

  const toDataUri = async (file: string) => {
    const buf = await sharp(`${process.cwd()}/public/projects/${file}`)
      .resize(540, 260, { fit: 'cover' })
      .jpeg({ quality: 72 })
      .toBuffer()
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  }
  const assets: Assets = {
    majordom: await toDataUri('majordom.webp'),
    startbounty: await toDataUri('startbounty.webp'),
    stark: await toDataUri('stark.webp'),
  }

  const banners: Record<string, (t: 'light' | 'dark') => string> = {
    majordom: (t) => majordom(t),
    company: (t) => company(t, assets),
    flagship: (t) => flagship(t, assets),
    coffee: (t) => coffee(t),
  }
  for (const [name, build] of Object.entries(banners)) {
    for (const theme of ['light', 'dark'] as const) {
      await sharp(Buffer.from(build(theme)), { density: 144 })
        .resize(W * 2)
        .webp({ quality: 82, effort: 6 })
        .toFile(`${dir}/${name}-${theme}.webp`)
    }
  }
  console.log('generated banners: majordom, company, flagship, coffee (light/dark webp)')
  return { props: {} }
}

export default BannersGen
