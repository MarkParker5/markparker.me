// Shared between notes and articles — both get the same like/reply/repost/
// share UI (see components/interaction-bar.tsx), resolving to whichever
// platforms make sense for that content type. Articles allow BOTH their own
// mirror platforms (Medium/Hashnode/Dev.to/Habr) AND the short-form
// platforms (Twitter/Bluesky/Telegram/Threads/Mastodon) — a reader might
// want to discuss a longform piece on either.
// `follow` is about the author, not this specific piece of content — unlike
// the other three actions, it always resolves to the platform profile (see
// getInteractionTarget below), never a direct link to this post.
export type InteractionAction = 'like' | 'reply' | 'repost' | 'share' | 'follow'

export type InteractionPlatform =
  | 'twitter'
  | 'bluesky'
  | 'telegram'
  | 'threads'
  | 'mastodon'
  | 'medium'
  | 'devto'
  | 'hashnode'
  | 'habr'

// Real brand glyphs for Bluesky/Threads only exist from FA 6.4+ (Threads)
// and 6.7+ (Bluesky) — the site pins 6.7.2 (see the CDN link in
// _document.tsx) specifically so these resolve correctly.
export const PLATFORM_META: Record<InteractionPlatform, { label: string; icon: string }> = {
  twitter: { label: 'Twitter', icon: 'fab fa-twitter' },
  bluesky: { label: 'Bluesky', icon: 'fab fa-bluesky' },
  telegram: { label: 'Telegram', icon: 'fab fa-telegram' },
  threads: { label: 'Threads', icon: 'fab fa-threads' },
  mastodon: { label: 'Mastodon', icon: 'fab fa-mastodon' },
  medium: { label: 'Medium', icon: 'fab fa-medium' },
  devto: { label: 'Dev.to', icon: 'fab fa-dev' },
  hashnode: { label: 'Hashnode', icon: 'fab fa-hashnode' },
  habr: { label: 'Habr', icon: 'fas fa-comment' },
}

// Canonical profile URL per platform — the fallback when there's no direct
// link for this specific piece of content on that platform yet.
export const PLATFORM_PROFILE_URL: Partial<Record<InteractionPlatform, string>> = {
  twitter: 'https://twitter.com/MarkParker_5',
  bluesky: 'https://bsky.app/profile/markparker5.bsky.social',
  telegram: 'https://t.me/parker_is_typing',
  threads: 'https://www.threads.net/@markparker_5',
  medium: 'https://markparker5.medium.com',
  devto: 'https://dev.to/markparker5',
  hashnode: 'https://markparker5.hashnode.dev',
  habr: 'https://habr.com/ru/users/MarkParker5/',
  // No public Mastodon account yet — omitted on purpose rather than
  // guessing an instance URL.
}

export const NOTE_INTERACTION_PLATFORMS: InteractionPlatform[] = [
  'twitter',
  'bluesky',
  'telegram',
  'threads',
  'mastodon',
]

// "Allow both blog and posts platforms for blog interactions" — the full
// union, blog's own mirrors first since those are the direct links most
// likely to resolve.
export const ARTICLE_INTERACTION_PLATFORMS: InteractionPlatform[] = [
  'twitter',
  'medium',
  'hashnode',
  'devto',
  'habr',
  'bluesky',
  'telegram',
  'threads',
  'mastodon',
]

export type InteractionTarget = {
  href: string
  // Changes the label shown in the action popover: a direct link to the
  // actual mirrored post, a compose intent that pre-fills a new post (only
  // possible where the platform exposes a public web-intent URL, i.e.
  // Twitter, and only for reply/repost — never for `like`, since there's no
  // such thing as "liking" a post you just wrote), or a plain fallback to
  // the profile itself.
  kind: 'direct' | 'compose' | 'profile'
}

// Resolves what an action button should link to for one platform, in order
// of honesty: the real mirrored post if there is one, then a pre-filled
// compose intent if the platform supports one and the action makes sense,
// then just the profile — never a dead link, and never pretending an
// action happened against a post with no real id. `share` never falls back
// to a profile (see InteractionBar's Web Share API entry instead).
export function getInteractionTarget(
  platform: InteractionPlatform,
  opts: { directUrl?: string; composeText?: string; action: InteractionAction },
): InteractionTarget | null {
  // Always the profile — a "follow" button that happened to link to a
  // single post's mirror would follow the wrong thing.
  if (opts.action === 'follow') {
    const profile = PLATFORM_PROFILE_URL[platform]
    return profile ? { href: profile, kind: 'profile' } : null
  }

  if (opts.directUrl) return { href: opts.directUrl, kind: 'direct' }

  if (platform === 'twitter' && (opts.action === 'reply' || opts.action === 'repost') && opts.composeText) {
    return { href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(opts.composeText)}`, kind: 'compose' }
  }

  if (opts.action === 'share') return null

  const profile = PLATFORM_PROFILE_URL[platform]
  return profile ? { href: profile, kind: 'profile' } : null
}
