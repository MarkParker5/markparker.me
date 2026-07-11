import notesData from './data/notes.json'

// data/notes.json is a generated artifact (gitignored) — never edit it by
// hand. The real source of truth is data/notes.jsonc (comments allowed),
// written by hand and by an external cross-posting bot (a separate
// project) using `jsonc-parser`'s modify()/applyEdits() so comments survive
// automated writes. `npm run generate:notes` (wired as a pre-dev/pre-build
// hook) converts jsonc → json; this module just imports the plain result.
export type NotePlatform = 'twitter' | 'bluesky' | 'telegram' | 'threads' | 'mastodon' | 'instagram'

export type NoteMirror = {
  platform: NotePlatform
  // Absent when the bot hasn't posted there yet (or never will, e.g. a
  // platform crossposted only some notes to) — callers fall back to a
  // profile link or a compose-intent link, see `getMirrorTarget` below.
  url?: string
}

export type NoteMeta = {
  id: string
  // Full ISO 8601 datetime (with offset or 'Z'), not just a day — needed
  // both for correct same-day ordering and for the "5 min ago"/"3 hours
  // ago" buckets in the UI's relative-time display to mean anything.
  date: string
  datePretty: string
  // English only — this is a single-author site, cross-posted (e.g. to the
  // Russian-language Telegram channel) is just a mirror link, not a second
  // stored translation.
  body: string
  tags?: string[]
  pinned?: boolean
  hidden?: boolean
  // Visible only in local dev (`npm run dev`), never in a production
  // build/export — for trying out layout/copy before a note is real.
  preview?: boolean
  mirrors: NoteMirror[]
}

const isDev = process.env.NODE_ENV === 'development'

// Real brand glyphs for Bluesky/Threads only exist from FA 6.4+ (Threads)
// and 6.7+ (Bluesky) — the site now pins 6.7.2 (see the CDN link in
// profile.tsx / article.tsx) specifically so these resolve correctly.
export const PLATFORM_META: Record<NotePlatform, { label: string; icon: string }> = {
  twitter: { label: 'Twitter', icon: 'fab fa-twitter' },
  bluesky: { label: 'Bluesky', icon: 'fab fa-bluesky' },
  telegram: { label: 'Telegram', icon: 'fab fa-telegram' },
  threads: { label: 'Threads', icon: 'fab fa-threads' },
  mastodon: { label: 'Mastodon', icon: 'fab fa-mastodon' },
  instagram: { label: 'Instagram', icon: 'fab fa-instagram' },
}

// Canonical profile URL per platform — the fallback when a note has no
// mirror entry (or a mirror entry with no url yet) for that platform. Kept
// here, not in socials.tsx, so this module has no import back onto the
// page-level socials config.
export const PLATFORM_PROFILE_URL: Partial<Record<NotePlatform, string>> = {
  twitter: 'https://twitter.com/MarkParker_5',
  bluesky: 'https://bsky.app/profile/markparker5.bsky.social',
  telegram: 'https://t.me/parker_is_typing',
  threads: 'https://www.threads.net/@markparker_5',
  instagram: 'https://instagram.com/markparker_5',
  // No public Mastodon account yet — omitted on purpose rather than
  // guessing an instance URL.
}

export type NoteAction = 'like' | 'reply' | 'repost' | 'share'

export type MirrorTarget = {
  href: string
  // Changes the label shown in the action popover: a direct link to the
  // actual mirrored post, a compose intent that pre-fills a new post (only
  // possible where the platform exposes a public web-intent URL, i.e.
  // Twitter), or a plain fallback to the profile itself.
  kind: 'direct' | 'compose' | 'profile'
}

// Resolves what an action button should link to for one platform, in order
// of honesty: the real mirrored post if we have it, then a pre-filled
// compose intent if the platform supports one AND that makes sense for the
// action, then just the profile — never a dead link, and never pretending
// an action happened against a post we have no id for.
//
// A "compose a new post" fallback only makes sense for reply/repost (both
// are, functionally, posting something) — never for `like` (there's no such
// thing as "liking" a post you just wrote) and never for `share` (share has
// its own device-level fallback, the Web Share API — see ActionPopover).
export function getMirrorTarget(platform: NotePlatform, note: NoteMeta, action: NoteAction): MirrorTarget | null {
  const mirror = note.mirrors.find((m) => m.platform === platform)
  if (mirror?.url) return { href: mirror.url, kind: 'direct' }

  if (platform === 'twitter' && (action === 'reply' || action === 'repost')) {
    return {
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(note.body)}`,
      kind: 'compose',
    }
  }

  if (action === 'share') return null

  const profile = PLATFORM_PROFILE_URL[platform]
  return profile ? { href: profile, kind: 'profile' } : null
}

const notes = notesData as NoteMeta[]

export function getPublicNotes(): NoteMeta[] {
  return notes
    .filter((n) => !n.hidden)
    .filter((n) => !n.preview || isDev)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // most recent first
}

// Pin affects only this single "latest" pick — never list ordering.
export function getLatestOrPinnedNote(): NoteMeta | undefined {
  const all = getPublicNotes()
  return all.find((n) => n.pinned) ?? all[0]
}

// Homepage preview: pinned note first (if any), then most recent. This used
// to look like a sort bug when a 2-day-old pinned note jumped ahead of a
// 4-hour-old one with no explanation — now that NotesList renders an
// explicit "📌 pinned" badge, the out-of-order position reads as intentional
// instead of broken, so the pin can safely win again. Never affects /notes'
// own chronological ordering (getPublicNotes above stays untouched).
export function getPreviewNotes(count = 3): NoteMeta[] {
  const all = getPublicNotes()
  const pinned = all.find((n) => n.pinned)
  const ordered = pinned ? [pinned, ...all.filter((n) => n.id !== pinned.id)] : all
  return ordered.slice(0, count)
}
