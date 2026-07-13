import notesData from './data/notes.json'
import { PLATFORM_META as SHARED_PLATFORM_META } from './interactions'

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
  // profile link or a compose-intent link, see interactions.ts's
  // getInteractionTarget (used via components/interaction-bar.tsx).
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
//
// Delegates to the shared interactions.ts module (also used by articles),
// extended with `instagram` — the one NotePlatform not part of that shared
// union, since it's never offered as an active interaction target (no
// compose intent, no cross-content-type relevance to articles), just kept
// here for `NoteMirror` data-shape compatibility.
export const PLATFORM_META: Record<NotePlatform, { label: string; icon: string }> = {
  ...SHARED_PLATFORM_META,
  instagram: { label: 'Instagram', icon: 'fab fa-instagram' },
}

const notes = notesData as NoteMeta[]

// Pinned notes first (most-recent-pinned first if more than one), then
// everything else most-recent-first. A pinned note is otherwise just a note
// with an old date — sorting purely by date could bury it at the very
// bottom of the list, which defeats the point of pinning it. NotesList
// renders an explicit "📌 pinned" badge, so the out-of-order position reads
// as intentional rather than a sort bug.
export function getPublicNotes(): NoteMeta[] {
  const all = notes
    .filter((n) => !n.hidden)
    .filter((n) => !n.preview || isDev)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // most recent first
  const pinned = all.filter((n) => n.pinned)
  const rest = all.filter((n) => !n.pinned)
  return [...pinned, ...rest]
}

export function getLatestOrPinnedNote(): NoteMeta | undefined {
  return getPublicNotes()[0]
}

// Homepage preview is just the first `count` of the same ordering the full
// /notes page uses now — no separate pinning logic to keep in sync.
export function getPreviewNotes(count = 3): NoteMeta[] {
  return getPublicNotes().slice(0, count)
}
