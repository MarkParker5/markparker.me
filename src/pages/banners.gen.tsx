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

// A row of parallelogram cells (the "/ / /" look), each filled with a project
// hero image (dark-overlaid for legible labels) or a solid accent panel.
function imageCells(cells: { label: string; img?: string }[], X0: number, Y0: number, w: number, h: number, skew: number, p: Palette): string {
  const n = cells.length
  const cw = w / n
  const defs: string[] = []
  const shapes: string[] = []
  cells.forEach((c, i) => {
    const lTop = i === 0 ? X0 : X0 + i * cw + skew / 2
    const lBot = i === 0 ? X0 : X0 + i * cw - skew / 2
    const rTop = i === n - 1 ? X0 + w : X0 + (i + 1) * cw + skew / 2
    const rBot = i === n - 1 ? X0 + w : X0 + (i + 1) * cw - skew / 2
    const poly = `${lTop},${Y0} ${rTop},${Y0} ${rBot},${Y0 + h} ${lBot},${Y0 + h}`
    const cx = X0 + i * cw + cw / 2
    if (c.img) {
      // Image only — no dark overlay, no text label (the hero art already
      // carries the project's own name/branding).
      const bx = Math.min(lTop, lBot)
      const bw = Math.max(rTop, rBot) - bx
      const id = `clip${i}`
      defs.push(`<clipPath id="${id}"><polygon points="${poly}"/></clipPath>`)
      shapes.push(`<g clip-path="url(#${id})"><image href="${c.img}" x="${bx}" y="${Y0}" width="${bw}" height="${h}" preserveAspectRatio="xMidYMid slice"/></g>`)
    } else {
      // No image → solid accent tile with its label.
      shapes.push(`<polygon points="${poly}" fill="${p.accent}"/>`)
      shapes.push(`<text x="${cx}" y="${Y0 + h / 2 + 11}" fill="${p.onAccent}" font-size="30" font-weight="800" letter-spacing="1.5" text-anchor="middle">${esc(c.label)}</text>`)
    }
    if (i > 0) shapes.push(`<line x1="${X0 + i * cw - skew / 2}" y1="${Y0 + h}" x2="${X0 + i * cw + skew / 2}" y2="${Y0}" stroke="${p.bg}" stroke-width="5"/>`)
  })
  return `<defs>${defs.join('')}</defs>${shapes.join('\n')}`
}

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
  <text x="48" y="132" fill="${p.title}" font-size="34" font-weight="800">The private, offline-first smart home</text>
  <text x="48" y="172" fill="${p.body}" font-size="22">that's actually smart — one hub, no cloud, your data stays home.</text>
  ${cta(W - 44, H / 2, 'Explore MajorDom', p.accent, p)}`
  return svg(H, inner, p)
}

// ---- 2. Parker Industries (company) — "/ / /" with project art ----------
function company(theme: 'light' | 'dark', a: Assets): string {
  const p = { ...base(theme), accent: '#0969da' } as Palette
  const H = 200
  const inner = `
  <text x="${W / 2}" y="42" fill="${p.muted}" font-size="17" text-anchor="middle" letter-spacing="0.5">made by Parker Industries — currently building</text>
  ${imageCells([{ label: 'MAJORDOM', img: a.majordom }, { label: 'STARTBOUNTY', img: a.startbounty }, { label: 'ABOUT US' }], 0, 60, W, 118, 44, p)}`
  return svg(H, inner, p)
}

// ---- 3. Personal / random repo — flagship art + bottom-right link -------
function flagship(theme: 'light' | 'dark', a: Assets): string {
  const p = { ...base(theme), accent: '#0969da' } as Palette
  const H = 236
  const inner = `
  <text x="44" y="42" fill="${p.muted}" font-size="17" letter-spacing="0.5">a Mark Parker project — a few more I'm proud of</text>
  ${imageCells([{ label: 'MAJORDOM', img: a.majordom }, { label: 'STARK', img: a.stark }, { label: 'STARTBOUNTY', img: a.startbounty }], 0, 58, W, 118, 44, p)}
  ${mpLink(214, p)}`
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
  ${cta(W - 44, H / 2, 'Buy me a coffee', p.accent, p)}`
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
