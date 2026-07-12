import { useEffect, useRef, useState } from 'react'
import { NoteAction, NoteMeta, NotePlatform, PLATFORM_META, getMirrorTarget } from '../note'
import { trackNoteAction } from '../analytics'
import { relativeTime } from '../relative-time'
import { useDesignToggles, ShareIconStyle } from '../design-toggles'
import { Reveal } from './reveal'

const SHARE_ICON: Record<ShareIconStyle, string> = {
  upload: 'fas fa-arrow-up-from-bracket',
  branch: 'fas fa-share',
  'branch-outline': 'fa-regular fa-share-from-square',
  nodes: 'fas fa-share-nodes',
}

type Props = {
  notes: NoteMeta[]
}

// Renders the absolute date first (matches the static/build-time HTML
// exactly, so there's no hydration mismatch), then swaps to a relative
// string client-side, against the visitor's real current time — computing
// "2 days ago" at build time would freeze it there until the next deploy.
function NoteDate({ date, datePretty }: { date: string; datePretty: string }) {
  const [display, setDisplay] = useState(datePretty)

  useEffect(() => {
    const rel = relativeTime(date, new Date())
    if (rel) setDisplay(rel)
  }, [date])

  return (
    <span className="text-sm text-faint-light dark:text-faint-dark" title={datePretty}>
      {display}
    </span>
  )
}

const ACTION_META: Record<
  NoteAction,
  { icon?: string; label: string; popoverVerb: string; hoverClass: string }
> = {
  reply: {
    icon: 'fa-regular fa-comment',
    label: 'Reply',
    popoverVerb: 'Reply on',
    hoverClass:
      'hover:text-link2-light dark:hover:text-link2-dark hover:bg-link2-light/10 dark:hover:bg-link2-dark/10',
  },
  repost: {
    icon: 'fas fa-retweet',
    label: 'Repost',
    popoverVerb: 'Repost via',
    hoverClass: 'hover:text-[#00ba7c] hover:bg-[#00ba7c]/10',
  },
  like: {
    icon: 'fa-regular fa-heart',
    label: 'Like',
    popoverVerb: 'Like on',
    hoverClass: 'hover:text-[#f91880] hover:bg-[#f91880]/10',
  },
  share: {
    // icon left undefined here — resolved per-render from the dev A/B
    // toggle (see SHARE_ICON above); the default fa-arrow-up-from-bracket
    // glyph reads as "upload" more than "share".
    label: 'Share',
    popoverVerb: 'Share via',
    hoverClass:
      'hover:text-link2-light dark:hover:text-link2-dark hover:bg-link2-light/10 dark:hover:bg-link2-dark/10',
  },
}

const ALL_PLATFORMS: NotePlatform[] = ['twitter', 'bluesky', 'threads', 'mastodon', 'telegram']

// Every mirror account that can do something real for this action is
// listed — there's no per-platform "like" API to call from a static site,
// so reply/repost/like all resolve to "go interact with (or start) the post
// there". `share` never lists a profile-only fallback (see getMirrorTarget)
// — instead it gets its own device-level option via the Web Share API,
// which works everywhere the browser supports it, regardless of mirrors.
function ActionPopover({
  note,
  action,
  align,
  onClose,
}: {
  note: NoteMeta
  action: NoteAction
  align: 'left' | 'right'
  onClose: () => void
}) {
  const meta = ACTION_META[action]
  const { hideUnavailableMirrors } = useDesignToggles()
  // Starts scaled-down/transparent, then transitions in next frame — a
  // conditionally-*mounted* element can't transition its own mount (there's
  // no "before" state in the DOM to animate from), so this fakes one: mount
  // at the start state, flip to the end state a tick later, let the
  // transition classes below do the rest.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const targets = ALL_PLATFORMS.map((platform) => ({ platform, target: getMirrorTarget(platform, note, action) }))
    .filter(
      (t): t is { platform: NotePlatform; target: NonNullable<ReturnType<typeof getMirrorTarget>> } =>
        t.target !== null,
    )
    // "profile" is a weak fallback (just "go to my account", not an action
    // on THIS post) — hidden by default via the dev toggle since it can't
    // actually do what the button promised.
    .filter((t) => !hideUnavailableMirrors || t.target.kind !== 'profile')

  const canWebShare = action === 'share' && typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  function shareViaDevice() {
    navigator
      .share({ text: note.body, url: `${window.location.origin}/notes#${note.id}` })
      .catch(() => {
        // user cancelled the native share sheet — not an error
      })
    trackNoteAction(note.id, action, 'web-share')
    onClose()
  }

  return (
    <div
      // Anchored to whichever side keeps it inside the card: the action row
      // spreads reply/repost near the left edge and like/share near the
      // right, so a popover that always grows from `left-0` overflows off
      // the viewport's right edge on mobile for the two right-hand buttons.
      // Scales/fades in from its anchor corner — origin matches `align` so
      // it visibly grows out of the button that opened it, not the middle
      // of nowhere.
      className={`absolute z-10 top-full mt-1.5 ${align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}
                 w-72 rounded-xl border bg-back-light dark:bg-back-dark shadow-lg py-2 font-sans
                 transition-all duration-100 ease-out ${entered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      {canWebShare && (
        <button
          onClick={shareViaDevice}
          className="flex items-center gap-3.5 px-4 py-3 text-base w-full text-left hover:bg-back-secondary-light
                     dark:hover:bg-back-secondary-dark duration-100"
        >
          <i className="fas fa-mobile-screen w-5 text-center text-lg text-muted-light dark:text-muted-dark" />
          <span className="font-semibold">Share via device…</span>
        </button>
      )}
      {targets.length === 0 && !canWebShare && (
        <p className="px-4 py-3 text-base text-faint-light dark:text-faint-dark">Nothing to {action} yet.</p>
      )}
      {targets.map(({ platform, target }) => {
        const platformMeta = PLATFORM_META[platform]
        return (
          <a
            key={platform}
            href={target.href}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              trackNoteAction(note.id, action, platform)
              onClose()
            }}
            className="flex items-center gap-3.5 px-4 py-3 text-base hover:bg-back-secondary-light
                       dark:hover:bg-back-secondary-dark duration-100"
          >
            <i className={`${platformMeta.icon} w-5 text-center text-lg text-muted-light dark:text-muted-dark`} />
            <span>
              {meta.popoverVerb} <span className="font-semibold">{platformMeta.label}</span>
            </span>
          </a>
        )
      })}
    </div>
  )
}

function NoteActionButton({
  note,
  action,
  align,
  open,
  onToggle,
}: {
  note: NoteMeta
  action: NoteAction
  align: 'left' | 'right'
  open: boolean
  onToggle: () => void
}) {
  const meta = ACTION_META[action]
  const { shareIcon } = useDesignToggles()
  const icon = meta.icon ?? SHARE_ICON[shareIcon]
  // Wraps BOTH the button and its popover — not just the popover — so a
  // click on the button itself counts as "inside" for the outside-click
  // check below. It used to wrap only the popover: clicking the toggle
  // button to close an already-open popover fired the document-level
  // mousedown handler first (button was "outside" the popover-only ref),
  // which closed it — then the button's own onClick fired a split second
  // later against a stale `open` closure and reopened it right back.
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onToggle()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onToggle])

  return (
    <div className="relative" ref={containerRef}>
      <button
        title={meta.label}
        aria-label={meta.label}
        onClick={() => {
          if (!open) trackNoteAction(note.id, action)
          onToggle()
        }}
        className={`w-10 h-10 flex items-center justify-center rounded-full text-faint-light dark:text-faint-dark
                    duration-150 ${meta.hoverClass} ${open ? meta.hoverClass : ''}`}
      >
        <i className={`${icon} text-l`} />
      </button>
      {open && <ActionPopover note={note} action={action} align={align} onClose={onToggle} />}
    </div>
  )
}

function NoteActionsRow({ note }: { note: NoteMeta }) {
  const [openAction, setOpenAction] = useState<NoteAction | null>(null)
  // Left/right split matches visual position in the row below — reply and
  // repost sit toward the left edge of the card, like and share toward the
  // right, so their popovers grow inward from whichever edge they're near.
  const actions: { action: NoteAction; align: 'left' | 'right' }[] = [
    { action: 'reply', align: 'left' },
    { action: 'repost', align: 'left' },
    { action: 'like', align: 'right' },
    { action: 'share', align: 'right' },
  ]

  return (
    <div className="flex items-center justify-between max-w-xs -ml-2.5 mt-1">
      {actions.map(({ action, align }) => (
        <NoteActionButton
          key={action}
          note={note}
          action={action}
          align={align}
          open={openAction === action}
          onToggle={() => setOpenAction((cur) => (cur === action ? null : action))}
        />
      ))}
    </div>
  )
}

export const NotesList = ({ notes }: Props) => {
  const { cardStyle } = useDesignToggles()

  if (notes.length === 0) {
    return (
      <p className="font-sans text-sm text-muted-light dark:text-muted-dark text-center">
        No notes match this filter.
      </p>
    )
  }

  // A faint tint, not the old full bg-secondary swap — same restraint as
  // the project cards now use, so the two content types share one hover
  // language instead of each inventing its own.
  // No `rounded-lg` on the divider variant — border-radius on a box with
  // only a bottom border curves the border-b line itself inward at both
  // ends instead of a flat edge-to-edge divider.
  const cardClass =
    cardStyle === 'border'
      ? 'border rounded-xl px-4 pt-3 pb-2 hover:bg-black/[0.025] dark:hover:bg-white/[0.04] hover:shadow-sm'
      : 'border-b last:border-b-0 px-1 pt-3 pb-3 first:pt-0 hover:bg-black/[0.025] dark:hover:bg-white/[0.04]'

  return (
    <div className={`mx-auto max-w-xl flex flex-col ${cardStyle === 'border' ? 'gap-3' : ''}`}>
      {notes.map((note) => (
        <div key={note.id} id={note.id} className={`${cardClass} duration-150`}>
          {/* Border/hover/id stay on the outer div (instant) — only the
              content fades+slides in, one card at a time as it scrolls into
              view, on every page that renders notes (not just the
              homepage). */}
          <Reveal className="flex gap-3">
            <img src="/mark-parker.jpg" alt="" className="w-9 h-9 rounded-full shrink-0 mt-0.5 object-cover" />
            <div className="min-w-0 flex-1 font-sans">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-primary-light dark:text-primary-dark">Mark Parker</span>
                <span className="text-faint-light dark:text-faint-dark">·</span>
                <NoteDate date={note.date} datePretty={note.datePretty} />
                {/* Explicit, not implicit — without this, a pinned note sitting
                    out of chronological order (by design) reads as a sort bug
                    rather than an intentional pin. */}
                {note.pinned && (
                  <span title="Pinned" className="ml-1 text-faint-light dark:text-faint-dark">
                    <i className="fas fa-thumbtack text-sm" />
                  </span>
                )}
                {note.preview && (
                  <span className="ml-auto font-mono text-[9px] leading-none text-faint-light dark:text-faint-dark">
                    preview
                  </span>
                )}
              </div>
              <p className="text-[1.125rem] leading-snug whitespace-pre-wrap mt-0.5">{note.body}</p>
              <NoteActionsRow note={note} />
            </div>
          </Reveal>
        </div>
      ))}
    </div>
  )
}
