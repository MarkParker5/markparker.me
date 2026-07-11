import { Link } from './link'
import { ProjectMeta, ProjectOwner, ProjectStatus } from '../project'
import { getAllArticles } from '../article'
import { useDesignToggles } from '../design-toggles'

type Props = {
  projects: ProjectMeta[]
}

// Color follows status psychology, same idea as a traffic light: green =
// actively going, amber = in progress/unsettled, blue = done, violet = kept
// alive but not driven forward, gray = dead, yellow = just for fun.
const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  wip: { label: 'WIP', color: '#f59e0b' },
  active: { label: 'active', color: '#22c55e' },
  maintained: { label: 'maintained', color: '#8b5cf6' },
  shipped: { label: 'shipped', color: '#3b82f6' },
  archived: { label: 'archived', color: '#6b7280' },
  hobby: { label: 'hobby', color: '#eab308' },
}

const ownerMeta: Record<ProjectOwner, { label: string; href?: string }> = {
  skyhigh: { label: 'SkyHigh', href: 'https://skyhighapps.com' },
  'parker-industries-in-house': { label: 'Parker Industries — In-house', href: 'https://parker-industries.org' },
  'parker-industries-contract': { label: 'Contract @ Parker Industries', href: 'https://parker-industries.org' },
  freelance: { label: 'Freelance' },
  personal: { label: 'Personal' },
}

// Hardcoded per known tag first (deliberate, memorable colors matching what
// the tag means), falling back to a hash-derived hue for anything added to
// TAG_ORDER later without a matching entry here.
const TAG_COLORS: Record<string, string> = {
  app: '#6366f1',
  cli: '#f59e0b',
  library: '#10b981',
  ios: '#0ea5e9',
  web: '#3b82f6',
  hardware: '#f97316',
  'raspberry-pi': '#ef4444',
  voice: '#8b5cf6',
  ai: '#ec4899',
  charity: '#14b8a6',
  hackathon: '#eab308',
  video: '#a855f7',
  oss: '#22c55e',
}

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${hash % 360}, 65%, 55%)`
}

function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? hashColor(tag)
}

// Plain text, same weight/color as the date next to it — no dot, no bold.
// A colored dot here used to duplicate the status badge's own circle right
// above it (two unrelated dots reading as one system), and bold/link-colored
// owner text made the row look like three different UI elements instead of
// one line: "made in 2022 while working at X". Still a real link when the
// owner has a public page, just styled to disappear into the sentence until
// hovered.
function OwnerLabel({ owner }: { owner?: ProjectOwner }) {
  if (!owner) return null
  const meta = ownerMeta[owner]
  return meta.href ? (
    <Link href={meta.href} newTab className="hover:underline">
      {meta.label}
    </Link>
  ) : (
    <span>{meta.label}</span>
  )
}

function RelatedArticles({ ids }: { ids?: string[] }) {
  if (!ids || ids.length === 0) return null
  const articles = getAllArticles().filter((a) => ids.includes(a.id))
  if (articles.length === 0) return null

  return (
    <span className="block text-base">
      Related:
      {articles.map((a) => (
        <span key={a.id} className="block pl-4">
          • <Link style={1} href={`/blog/${a.id}`}>{a.title}</Link>
        </span>
      ))}
    </span>
  )
}

function linkIcon(href: string): string {
  if (href.includes('github.com')) return 'fab fa-github'
  if (href.startsWith('/blog/') || href.startsWith('/')) return 'fas fa-file-lines'
  return 'fas fa-arrow-up-right-from-square'
}

// Icon-led text, muted-dot separated — GitHub's stars/forks/license row,
// repurposed for source/write-up/live-site links since we don't have real
// repo stats to show. Pixels are cheap: 14px minimum, same as the rest of
// a project card's secondary text (year, tags) — a 12px link row read as an
// afterthought next to everything else.
function ProjectLinks({ links }: { links: ProjectMeta['links'] }) {
  if (links.length === 0) return null
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-base text-muted-light dark:text-muted-dark">
      {links.map((link, i) => (
        <span key={link.href} className="flex items-center gap-4">
          {i > 0 && <span className="text-faint-light dark:text-faint-dark">·</span>}
          <Link
            style={1}
            href={link.href}
            newTab={link.href.startsWith('http')}
            className="inline-flex items-center gap-2"
          >
            <i className={`${linkIcon(link.href)} text-base`} />
            {link.label}
          </Link>
        </span>
      ))}
    </span>
  )
}

// Background-filled, per-tag colored pill — GitHub's topic tags, but with a
// fixed color per tag instead of one flat neutral fill, so tags read as
// distinct categories at a glance rather than interchangeable keywords.
// Still real filter links: clicking one jumps straight to /projects?...
function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <span className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const color = tagColor(tag)
        return (
          <Link
            key={tag}
            href={`/projects?projects=${encodeURIComponent(tag)}`}
            className="inline-block text-base rounded-full font-medium duration-150 hover:brightness-110"
          >
            <span className="block py-1.5 px-3.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
              {tag}
            </span>
          </Link>
        )
      })}
    </span>
  )
}

// Two representations under live A/B review (toggle in the dev panel,
// bottom-right, dev-only): `circle` — a colored dot + label, no border,
// same shape language as OwnerChip; `border` — colored outline + colored
// text, no fill. Either way the badge trails the title (not pinned to a
// corner — there's nothing about a status that's more "global" than the
// title it describes), sized to actually read at a glance rather than
// disappear next to it.
function StatusBadge({ status }: { status: ProjectStatus }) {
  const { statusStyle } = useDesignToggles()
  const meta = STATUS_META[status]

  if (statusStyle === 'circle') {
    return (
      <span className="inline-flex items-center gap-2 text-base font-medium leading-none text-muted-light dark:text-muted-dark shrink-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
        {meta.label}
      </span>
    )
  }

  return (
    <span
      className="text-base leading-none border rounded-full px-3 py-1.5 font-medium shrink-0"
      style={{ borderColor: meta.color, color: meta.color }}
    >
      {meta.label}
    </span>
  )
}

function ProjectTitle({ project }: { project: ProjectMeta }) {
  // Single-line ellipsis, not wrapping — some titles are raw repo names
  // (fastapi-ws-docs-demo, chrome-dino-bot-extension...) that would
  // otherwise blow out the layout at this font size. Full title still
  // available via the native title= tooltip.
  const className = 'truncate min-w-0'
  return project.links[0] ? (
    <Link style={2} href={project.links[0].href} newTab className={className} title={project.title}>
      {project.title}
    </Link>
  ) : (
    <span className={className} title={project.title}>
      {project.title}
    </span>
  )
}

function ProjectImage({ project }: { project: ProjectMeta }) {
  if (!project.imageUrl) return null
  return (
    <a href={project.links[0]?.href ?? '#'} target="_blank" rel="noreferrer" className="block">

      {/* Capped at 16:9 (never taller) — tall portrait screenshots get
          cropped to fit via object-cover rather than stretching the row. */}
      <img
        src={project.imageUrl}
        alt={project.title}
        className="w-full aspect-video object-cover rounded"
      />
    </a>
  )
}

function MetaLine({ project }: { project: ProjectMeta }) {
  const { metaOrder } = useDesignToggles()

  // "Role @ Owner" only makes sense when role is a job title held AT that
  // owner (an actual employer, e.g. SkyHigh) — anywhere else (hackathon
  // team, or no role at all) the two facts are independent, so they're
  // comma-joined instead, or the role is dropped entirely when owner alone
  // already says it (Founder/Solo/Engineer — filtered out at the data level).
  // Deliberately no divider inside this phrase — the ONE bigger bullet below
  // is the only separator on this row, between the date and everything else.
  const roleAtOwner = project.role && project.owner === 'skyhigh'
  const context = roleAtOwner ? (
    <>
      {project.role} @ <OwnerLabel owner={project.owner} />
    </>
  ) : project.role ? (
    <>
      {project.role}, <OwnerLabel owner={project.owner} />
    </>
  ) : (
    <OwnerLabel owner={project.owner} />
  )
  const date = <span>{project.yearLabel ?? project.year}</span>
  // Bigger and lighter than the surrounding text — reads as a log/timeline
  // separator ("in 2022 • while at SkyHigh"), not another category tag.
  const bullet = (
    <span className="text-xl leading-none text-faint-light dark:text-faint-dark">•</span>
  )

  return (
    <span className="flex flex-wrap items-center gap-2.5 text-base font-medium text-muted-light dark:text-muted-dark">
      {metaOrder === 'date-first' ? (
        <>
          {date}
          {bullet}
          {context}
        </>
      ) : (
        <>
          {context}
          {bullet}
          {date}
        </>
      )}
    </span>
  )
}

// Row spacing below the title scales with the spacing toggle: 0.625rem
// (10px) base, plus `spacing`% more on top — the initial ask was "~10% less
// dense" (= "+10% spacing"), the dev-panel slider goes to +150% for comparison.
const BASE_ROW_GAP_REM = 0.625

function ProjectCard({ project, spotlight }: { project: ProjectMeta; spotlight?: boolean }) {
  const { cardStyle, spacing } = useDesignToggles()
  // No hover highlight on the card as a whole — only the title, tags, and
  // links inside it are actually clickable, so a full-card hover implied
  // the whole thing was one link, which it isn't.
  // No `last:border-b-0` here — spotlight and others render as two separate
  // <ul>s, so "last in this list" fired on the last spotlight card (STARK)
  // even though DogCat Fund immediately follows it in the others list right
  // below, leaving that one boundary with no divider at all. Every divider
  // row (including the very last project overall) keeps its border-b now;
  // a trailing rule under the last card reads as a clean close-off, not a
  // bug the way a missing one mid-list did.
  const wrapperClass = cardStyle === 'border' ? 'rounded-xl border px-4 py-3.5' : 'border-b px-1 py-4 first:pt-0'
  const gapRem = BASE_ROW_GAP_REM * (1 + spacing / 100)

  return (
    <li className={`list-none ${wrapperClass} ${spotlight ? 'text-xl' : 'text-l'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <ProjectTitle project={project} />
        <StatusBadge status={project.status} />
      </div>
      <div className="flex flex-col" style={{ gap: `${gapRem}rem`, marginTop: `${gapRem}rem` }}>
        <ProjectImage project={project} />
        <MetaLine project={project} />
        <span className="block text-[1.125rem]">{project.blurb}</span>
        <TagChips tags={project.tags} />
        <ProjectLinks links={project.links.slice(1)} />
        <RelatedArticles ids={project.relatedArticleIds} />
      </div>
    </li>
  )
}

export const ProjectsList = ({ projects }: Props) => {
  const spotlight = projects.filter((p) => p.spotlight)
  const others = projects.filter((p) => !p.spotlight)

  return (
    <div className="mx-auto font-serif">
      {spotlight.length > 0 && (
        <ul className="flex flex-col gap-5 mb-11">
          {spotlight.map((project) => (
            <ProjectCard key={project.id} project={project} spotlight />
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <ul className="flex flex-col gap-4">
          {others.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      )}
    </div>
  )
}
