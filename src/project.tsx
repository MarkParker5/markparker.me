// `wip` (actively being built, nothing shipped yet) and `active` (shipped
// and still being actively developed) are different claims — don't conflate
// them. `maintained` replaces the old `graduated`: not under active
// development anymore, but still kept alive/patched (often under a
// different org than the one that built it).
export type ProjectStatus = 'wip' | 'active' | 'maintained' | 'shipped' | 'archived' | 'hobby'

// Structured affiliation instead of free-text roles: who the work was
// actually for, with Parker Industries split by engagement type since
// "founder" and "hired contractor" are different claims worth telling apart.
export type ProjectOwner =
  | 'skyhigh'
  | 'parker-industries-in-house'
  | 'parker-industries-contract'
  | 'freelance'
  | 'personal'

export type ProjectLink = {
  label: string
  href: string
}

export type ProjectMeta = {
  id: string
  title: string
  // The year work STARTED — the "since" date. Required; drives the
  // "Oldest first" sort and the left side of the displayed date. On its
  // own (no `until`) it renders as a single year for finished one-off
  // work, or as "since <year>" for anything still ongoing (see
  // ONGOING_STATUSES / formatProjectDate).
  year: number
  // Optional END year, making the date an explicit range "<year>–<until>"
  // (or a single "<year>" when it equals the start). Set it for work whose
  // span has actually ENDED; leave it off for ongoing projects (their
  // status supplies "since") and single-year one-offs. For a FORK this is
  // MY last commit year on the fork, not the upstream project's age.
  until?: number
  status: ProjectStatus
  // Only set when it says something owner doesn't already — e.g. "Hackathon
  // team" (personal), or "Software Engineer" (rendered "@ SkyHigh"). Skip it
  // for anything owner already implies (Founder, Solo, Engineer...).
  role?: string
  blurb: string
  tags: string[]
  links: ProjectLink[]

  // Available on every project regardless of tier — a small graveyard entry
  // getting an image someday isn't a schema restriction, just hasn't happened.
  imageUrl?: string

  // Who it was for / where he worked when it happened.
  owner?: ProjectOwner

  // 0–100, manually curated — how interesting/worth-a-look this is to a
  // stranger scanning the list, not how proud I am of the code. Roughly:
  // 90s+ = flagship/real user-facing products, 60s-80s = notable tools with
  // a real story (write-ups, novel idea), 20s-40s = solid but niche infra,
  // under 20 = small utility scripts. Missing = treated as 0. Drives the
  // default "interesting first" sort — deliberately a plain number instead
  // of a computed heuristic (GitHub stars, tag-based scoring, etc.) because
  // a hand-picked score is easier to reason about and fix than to debug a
  // formula that ranks the wrong project first.
  interest?: number

  hidden?: boolean
}

// status: wip (building, nothing shipped yet) · active (shipped, still being actively developed)
//       · maintained (not actively developed, but kept alive/patched — often now under an org, not by me solo)
//       · shipped (done, feature-complete, not maintained) · archived (dead, kept for the record)
//       · hobby (side project, no ambition beyond that)
//
// tags: a manually-ordered, deliberately small vocabulary — see TAG_ORDER
// below for the canonical order used when rendering filter chips. Grouped
// by kind: what it IS (app/cli/library), what it RUNS ON (ios/web/hardware/
// raspberry-pi), what DOMAIN it's in (voice/ai/charity/hackathon/video),
// plus oss as a cross-cutting flag. Not every related keyword — these are
// filter chips, not SEO keyword soup.
export const TAG_ORDER = [
  'app',
  'cli',
  'library',
  'ios',
  'web',
  'hardware',
  'raspberry-pi',
  'voice',
  'ai',
  'charity',
  'hackathon',
  'video',
  'oss',
]

const projects: ProjectMeta[] = [
  {
    id: 'dogcat-fund',
    interest: 82,
    title: 'DogCat Fund',
    year: 2025,
    status: 'shipped',
    blurb: 'Charity platform helping animal shelters raise funds transparently.',
    tags: ['web', 'app', 'charity'],
    links: [{ label: 'dogcat.org.ua', href: 'https://dogcat.org.ua' }],
    imageUrl: '/projects/dogcat.webp',
    owner: 'parker-industries-contract',
  },
  {
    id: 'archie',
    interest: 85,
    title: 'Archie',
    year: 2024,
    status: 'wip',
    blurb: 'Offline-first voice assistant for smart homes, built on STARK, bundled into the MajorDom ecosystem.',
    tags: ['voice', 'hardware', 'app'],
    links: [{ label: 'majordom.io', href: 'https://www.majordom.io/?details=archie' }],
    imageUrl: '/projects/archie.webp',
    owner: 'parker-industries-in-house',
  },
  {
    id: 'startbounty',
    interest: 90,
    title: 'StartBounty',
    year: 2024,
    status: 'wip',
    blurb: 'The easiest way to fund GitHub issues via user-placed bounties — get features faster, earn by contributing.',
    tags: ['web', 'app', 'oss'],
    links: [{ label: 'startbounty.io', href: 'https://startbounty.io' }],
    imageUrl: '/projects/startbounty.webp',
    owner: 'parker-industries-in-house',
  },
  {
    id: 'recaption',
    interest: 0,
    title: 'ReCaption',
    year: 2024,
    status: 'wip',
    blurb: 'In-house Parker Industries product, still unannounced — coming soon.',
    tags: ['app'],
    links: [{ label: 'parker-industries.org', href: 'https://parker-industries.org' }],
    owner: 'parker-industries-in-house',
    hidden: true,
  },
  {
    id: 'dr-house-ai',
    interest: 65,
    title: 'Dr. House — AI Diagnostician',
    year: 2024,
    status: 'archived',
    role: 'Hackathon team',
    blurb:
      'Built an AI diagnostician mobile app from scratch in a weekend hackathon in Cologne. Released it to the public domain and handed it off afterward rather than let it rot.',
    tags: ['ios', 'ai', 'hackathon', 'app'],
    links: [
      {
        label: 'the hackathon',
        href: '/blog/how-we-built-an-ai-startup-in-a-weekend-hackathon-in-germany',
      },
      {
        label: 'the handoff',
        href: '/blog/house-md-ai-diagnostician-in-your-phone-passing-the-torch-and-entrusting-a-startup-to-capable-hands',
      },
      { label: 'source', href: 'https://github.com/HouseMDAI' },
    ],
    owner: 'personal',
  },
  {
    id: 'python-app-architecture-demo',
    interest: 35,
    title: 'python-app-architecture-demo',
    year: 2024,
    status: 'archived',
    blurb: 'Clean-architecture example app written to accompany a Python architecture write-up: SOLID, DI, and layered structure for juniors.',
    tags: ['library', 'oss'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/python-app-architecture-demo' }],
    owner: 'personal',
  },
  {
    id: 'stark-place',
    interest: 25,
    title: 'STARK-PLACE',
    year: 2023,
    status: 'hobby',
    blurb: 'Platform library and community-extensions repo for STARK — a home for third-party skills and integrations.',
    tags: ['library', 'oss', 'voice'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/STARK-PLACE' }],
    owner: 'personal',
  },
  {
    id: 'fastapi-ws-docs-demo',
    interest: 25,
    title: 'fastapi-ws-docs-demo',
    year: 2025,
    status: 'hobby',
    blurb: "A tool that automatically adds WebSocket endpoints and Pydantic message schemas to FastAPI's native Swagger UI.",
    tags: ['library', 'oss', 'web'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/fastapi-ws-docs-demo' }],
    owner: 'personal',
  },
  {
    id: 'ios-localizer',
    interest: 60,
    title: 'iOS Auto-Localizer',
    year: 2021,
    status: 'shipped',
    blurb:
      'A console tool that finds every .strings file in an Xcode project and translates it into 20 languages in about 5 minutes.',
    tags: ['cli', 'oss', 'ios'],
    links: [
      { label: 'source', href: 'https://github.com/MarkParker5/XCodeLocalize' },
      { label: 'write-up', href: '/blog/localize-ios-app-in-5-minutes' },
    ],
    owner: 'personal',
  },
  {
    id: 'twitreads',
    interest: 45,
    title: 'TwiTreads',
    year: 2023,
    status: 'archived',
    blurb:
      'An abandoned idea to combine several socials into one platform: one-tap cross-posting to Telegram, Twitter, and Threads with built-in translation. Built as a clean-architecture example (MVVMP + SOLID + DI).',
    tags: ['ios', 'app', 'oss'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/TwiTreads' }],
    owner: 'personal',
  },
  {
    id: 'aiohomekit-fork',
    interest: 40,
    title: 'aiohomekit (fork)',
    year: 2025,
    status: 'maintained',
    blurb:
      'An asyncio-focused fork of the unofficial Python HomeKit SDK, kept alive for MajorDom-adjacent HomeKit integration work. Now maintained under Parker Industries.',
    tags: ['library', 'oss', 'hardware'],
    links: [{ label: 'source', href: 'https://github.com/ParkerIndustries/parker-aiohomekit' }],
    owner: 'parker-industries-in-house',
  },
  {
    id: 'pefi',
    interest: 80,
    title: 'PeFi',
    year: 2023,
    status: 'shipped',
    role: 'Software Engineer',
    blurb:
      'Personal financial accounting app. Built financial calculations for daily/weekly/monthly limits and balance predictions, real-time iCloud sync, and custom chart/data-visualisation logic with gradient animations and hero transitions.',
    tags: ['ios', 'app'],
    links: [
      { label: 'skyhighapps.com', href: 'https://skyhighapps.com/portfolio/pefi/' },
    ],
    imageUrl: '/projects/skyhigh-pefi.webp',
    owner: 'skyhigh',
  },
  {
    id: 'majordom',
    interest: 100,
    title: 'MajorDom',
    year: 2022,
    status: 'active',
    blurb:
      'Private, offline-first smart home system. Started out of frustration with cloud-locked voice assistants; now my flagship product at Parker Industries.',
    tags: ['hardware', 'app'],
    links: [
      { label: 'majordom.io', href: 'https://www.majordom.io' },
      { label: 'dev docs', href: 'https://docs.majordom.io' },
      { label: 'GitHub', href: 'https://github.com/MajorDom-Systems' },
    ],
    imageUrl: '/projects/majordom.webp',
    owner: 'parker-industries-in-house',
  },
  {
    id: 'captionme',
    interest: 74,
    title: 'CaptionMe',
    year: 2022,
    status: 'shipped',
    role: 'Software Engineer',
    blurb:
      'Automatic subtitle generation for videos. Built the full video player, caption grouping, trimming, rendering pipeline, and a custom AirPlay layout.',
    tags: ['ios', 'app'],
    links: [{ label: 'skyhighapps.com', href: 'https://skyhighapps.com/portfolio/captionme/' }],
    imageUrl: '/projects/skyhigh-captionme.webp',
    owner: 'skyhigh',
  },
  {
    id: 'anyobservableobject',
    interest: 20,
    title: 'AnyObservableObject',
    year: 2023,
    status: 'shipped',
    blurb: "Protocol-friendly equivalents to SwiftUI's property wrappers, but without compile-time type restrictions — use protocols in views without generics.",
    tags: ['library', 'oss', 'ios'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/AnyObservableObject' }],
    owner: 'personal',
  },
  {
    id: 'swiftytranslate',
    interest: 20,
    title: 'SwiftyTranslate',
    year: 2023,
    status: 'shipped',
    blurb: 'A Swift wrapper for public Google Translate — free, no API keys needed.',
    tags: ['library', 'oss', 'ios'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/SwiftyTranslate' }],
    owner: 'personal',
  },
  {
    id: 'rpi-networking',
    interest: 15,
    title: 'rpi-networking',
    year: 2023,
    status: 'hobby',
    blurb: 'Controls wifi, hotspot, and hostname of a Raspberry Pi — built while wiring up the first MajorDom hub firmware.',
    tags: ['cli', 'oss', 'raspberry-pi'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/rpi-networking' }],
    owner: 'personal',
  },
  {
    id: 'raspi-gpio',
    interest: 15,
    title: 'raspi-gpio',
    year: 2023,
    status: 'hobby',
    blurb: 'RPi.GPIO and spidev wrapper with mocks, for developing Raspberry Pi GPIO code on any platform.',
    tags: ['library', 'oss', 'raspberry-pi'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/raspi-gpio' }],
    owner: 'personal',
  },
  {
    id: 'rpi-reactive-gpio',
    interest: 12,
    title: 'rpi-reactive-gpio',
    year: 2023,
    status: 'hobby',
    blurb: 'Syntax sugar for controlling RPi.GPIO with a reactive design.',
    tags: ['library', 'oss', 'raspberry-pi'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/rpi-reactive-gpio' }],
    owner: 'personal',
  },
  {
    id: 'system-sounds',
    interest: 10,
    title: 'system-sounds',
    year: 2023,
    status: 'hobby',
    blurb: 'Lists and plays available system sound files, cross-platform.',
    tags: ['library', 'oss'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/system-sounds' }],
    owner: 'personal',
  },
  {
    id: 'smarthome-mvp',
    interest: 30,
    title: 'smarthome-mvp',
    year: 2021,
    status: 'archived',
    blurb: "An early smart-home minimum-viable-product experiment — the direct predecessor to MajorDom's first architecture.",
    tags: ['hardware', 'raspberry-pi', 'app'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/smarthome-mvp' }],
    owner: 'personal',
  },
  {
    id: 'manims',
    interest: 10,
    title: 'manims',
    year: 2023,
    status: 'hobby',
    blurb: 'Coded animations for a YouTube video about the proto-STARK voice assistant.',
    tags: ['library', 'oss', 'video'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/manims' }],
    owner: 'personal',
  },
  {
    id: 'coloring-apps',
    interest: 75,
    title: 'Coloring Apps (Kids / Boys / Girls)',
    year: 2021,
    status: 'shipped',
    role: 'Software Engineer',
    blurb:
      'A border-aware drawing app/game, shipped as three App Store targets from one Xcode project. Built the canvas and tool palette, border-detection drawing logic, multi-target project schemes, and automated content generation with image-enhancement tech.',
    tags: ['ios', 'app'],
    links: [
      { label: 'Kids Coloring Book', href: 'https://apps.apple.com/us/app/kids-coloring-book-draw-on-go/id1555256711' },
      { label: 'Boys Coloring Book', href: 'https://apps.apple.com/us/app/boys-coloring-book-draw-on-go/id1563700291' },
      { label: 'Girls Coloring Book', href: 'https://apps.apple.com/us/app/girls-coloring-book-draw-on-go/id1563700706' },
    ],
    imageUrl: '/projects/skyhigh-coloring-kids.webp',
    owner: 'skyhigh',
  },
  {
    id: 'videoeasy',
    interest: 78,
    title: 'VideoEasy',
    year: 2021,
    status: 'shipped',
    role: 'Software Engineer',
    blurb:
      'User-friendly automated video editor. Implemented the auto jump-cut algorithm, caption-generation and multi-language translation pipelines, and Firebase integration. Shipped to thousands of active users.',
    tags: ['ios', 'app'],
    links: [{ label: 'skyhighapps.com', href: 'https://skyhighapps.com/portfolio/vlog-easy-screenshot/' }],
    imageUrl: '/projects/skyhigh-videoeasy.webp',
    owner: 'skyhigh',
  },
  {
    id: 'stark',
    interest: 98,
    title: 'STARK',
    year: 2020,
    status: 'active',
    blurb:
      "Offline voice interface framework. \"Like FastAPI, but with speech instead of HTTP.\" Started as MajorDom's voice layer, grew into its own platform.",
    tags: ['library', 'oss', 'voice'],
    links: [
      { label: 'stark.markparker.me', href: 'https://stark.markparker.me' },
      { label: 'source', href: 'https://github.com/MarkParker5/STARK' },
    ],
    imageUrl: '/projects/stark.webp',
    owner: 'personal',
  },
  {
    id: 'fastrecorder',
    interest: 70,
    title: 'FastRecorder',
    year: 2020,
    status: 'shipped',
    role: 'Software Engineer',
    blurb: 'The first Apple Watch audio recorder. Implemented text-to-speech for automated note creation.',
    tags: ['ios', 'app'],
    links: [{ label: 'skyhighapps.com', href: 'https://skyhighapps.com/portfolio/fast-recorder/' }],
    imageUrl: '/projects/skyhigh-fastrecorder.webp',
    owner: 'skyhigh',
  },
  {
    id: 'chrome-dino-bot-extension',
    interest: 15,
    title: 'chrome-dino-bot-extension',
    year: 2019,
    status: 'hobby',
    blurb: 'A Chrome extension that automates the offline dino game.',
    tags: ['web'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/chrome-dino-bot-extension' }],
    owner: 'personal',
  },
  {
    id: 'of-terrain-generator',
    interest: 15,
    title: 'oF-Terrain-Generator',
    year: 2023,
    status: 'hobby',
    blurb: 'An openFrameworks (C++) app for procedural terrain generation using Perlin noise.',
    tags: ['app'],
    links: [{ label: 'source', href: 'https://github.com/MarkParker5/oF-Terrain-Generator' }],
    owner: 'personal',
  },

  // Backlog — add as they surface: university projects, other hackathons, dead
  // side projects. The graveyard is the point; don't skip the ones that failed.
]

export function getPublicProjects() {
  return projects.filter((p) => !p.hidden)
}

// The article→project cross-reference (ArticleMeta.relatedProjectId) is the
// canonical direction — a project→articles list used to exist here too, but
// that meant maintaining the same relationship in two places (and they
// could disagree). One direction, one source of truth: articles say which
// project they're about, and a project page derives its own "Related
// articles" list by filtering on that instead of storing it separately.
export function getProjectById(id: string): ProjectMeta | undefined {
  return projects.find((p) => p.id === id)
}

// Statuses that mean "still being actively worked on right now" — with no
// explicit `until` set, these render as "since <year>" and sort as the
// most recent thing possible under "Recent first" (they ARE current
// activity). NOT `maintained`: that means "kept alive/patched but not
// actively developed" (see ProjectStatus), which is a past-tense fact, so
// it renders as a bare start year like the other point-in-time statuses
// (shipped/archived/hobby) unless given an explicit `until` range.
const ONGOING_STATUSES = new Set<ProjectStatus>(['wip', 'active'])

// The date/range shown on a project's meta line and in feeds. `until`
// (explicit end) always wins — collapsing to a single year when it equals
// the start (began and finished the same year); otherwise ongoing work
// reads "since <year>" and everything else is a single year.
export function formatProjectDate(p: ProjectMeta): string {
  if (p.until) return p.until === p.year ? `${p.year}` : `${p.year}–${p.until}`
  if (ONGOING_STATUSES.has(p.status)) return `since ${p.year}`
  return `${p.year}`
}

// "How recent is this project's most recent activity" — the key "Recent
// first" sorts by. An explicit `until` is that end year; an ongoing
// project counts as more recent than any finished one (the sentinel keeps
// them above every real year regardless of when they started); a finished
// project with no `until` falls back to its start year.
const ONGOING_RECENCY = 9999
function recencyYear(p: ProjectMeta): number {
  if (p.until) return p.until
  if (ONGOING_STATUSES.has(p.status)) return ONGOING_RECENCY
  return p.year
}

// The top-N (default 3) projects the homepage features — the `spotlight`
// boolean flag this replaced was a second, hand-maintained axis that
// silently fought the sort; "the most interesting ones" is the same
// signal the /projects default view already uses, so there's now one
// source of truth for "what's worth showing first."
export function getHomepageProjects(limit = 3): ProjectMeta[] {
  return sortProjects(getPublicProjects(), 'interesting').slice(0, limit)
}

// Two distinct time axes, deliberately split into two options rather than
// one ambiguous "Recent" — "when was this last touched" (updated) and
// "when did this begin" (created) rank the list very differently: a
// long-running flagship is near the TOP by updated (still active) but in
// the MIDDLE by created (started years ago), while a brand-new one-off is
// top by created but, once finished, mid-pack by updated.
export type ProjectSort = 'interesting' | 'updated' | 'created' | 'old'

export const PROJECT_SORT_OPTIONS: { value: ProjectSort; label: string }[] = [
  { value: 'interesting', label: 'Interesting first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Recently created' },
  { value: 'old', label: 'Oldest first' },
]

// - interesting (default): curated `interest` desc, ties broken by recency.
// - updated: most-recent ACTIVITY first (until ?? ongoing ?? start) — an
//   actively-developed project outranks any finished one; ties by start.
// - created: newest START first, regardless of later activity; ties broken
//   by most-recent activity.
// - old: earliest START first — the "created" axis, other direction.
export function sortProjects(projects: ProjectMeta[], sort: ProjectSort): ProjectMeta[] {
  const sorted = [...projects]
  if (sort === 'updated') return sorted.sort((a, b) => recencyYear(b) - recencyYear(a) || b.year - a.year)
  if (sort === 'created') return sorted.sort((a, b) => b.year - a.year || recencyYear(b) - recencyYear(a))
  if (sort === 'old') return sorted.sort((a, b) => a.year - b.year)
  return sorted.sort((a, b) => (b.interest ?? 0) - (a.interest ?? 0) || recencyYear(b) - recencyYear(a))
}
