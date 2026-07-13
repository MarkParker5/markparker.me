import { useEffect, useRef, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  InteractionAction,
  InteractionPlatform,
  PLATFORM_META,
  getInteractionTarget,
} from '../interactions'
import { trackInteraction } from '../analytics'
import { useDesignToggles, ShareIconStyle } from '../design-toggles'

const SHARE_ICON: Record<ShareIconStyle, string> = {
  upload: 'fas fa-arrow-up-from-bracket',
  branch: 'fas fa-share',
  'branch-outline': 'fa-regular fa-share-from-square',
  nodes: 'fas fa-share-nodes',
}

const ACTION_META: Record<
  InteractionAction,
  { icon?: string; label: string; popoverVerb: string; hoverClass: string }
> = {
  reply: {
    icon: 'fa-regular fa-comment',
    label: 'Comment',
    popoverVerb: 'Comment on',
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
    // glyph reads as "upload" more than "share". Amber, not the same blue
    // as reply — every action needs its own hover color or hovering one
    // looks like a different action lit up.
    label: 'Share',
    popoverVerb: 'Share via',
    hoverClass: 'hover:text-[#f59e0b] hover:bg-[#f59e0b]/10',
  },
  follow: {
    // Font Awesome Free's "regular" (outline) style only ships a curated
    // subset of glyphs, and "user-plus" isn't in it — only the solid
    // version exists in the free tier, so this stays `fas` rather than a
    // broken/missing `fa-regular` reference.
    icon: 'fas fa-user-plus',
    label: 'Follow',
    popoverVerb: 'Follow on',
    hoverClass: 'hover:text-[#6366f1] hover:bg-[#6366f1]/10',
  },
}

type BarProps = {
  // Groups analytics (content_type) and gives each note/article's popovers
  // a stable identity — not otherwise rendered.
  contentType: string
  contentId: string
  platforms: InteractionPlatform[]
  // Per-platform direct link to THIS specific post/article, if one exists.
  getDirectUrl: (platform: InteractionPlatform) => string | undefined
  // Used for the Twitter compose-intent fallback (reply/repost) and as the
  // Web Share API's shared text.
  composeText: string
  // Absolute-resolvable path shared via the Web Share API and used to
  // build the target href for `share`.
  shareUrl: string
  // Bigger buttons/icons and a wider spread — for the standalone row at the
  // bottom of a full article, which has a whole page width to itself rather
  // than sitting inline under a compact list card.
  large?: boolean
  // Adds a 5th "Follow" action — about the author, not this post, so it's
  // opt-in rather than cluttering every compact list-card bar.
  showFollow?: boolean
}

// Every mirror account that can do something real for this action is
// listed — there's no per-platform "like" API to call from a static site,
// so reply/repost/like all resolve to "go interact with (or start) the
// post there". `share` never lists a profile-only fallback — instead it
// gets its own device-level option via the Web Share API, which works
// everywhere the browser supports it, regardless of mirrors.
//
// Rendered through a portal into document.body, positioned via `anchorRect`
// (the opening button/trigger's own getBoundingClientRect(), captured once
// at open time) rather than as a normal `position: absolute` child of its
// trigger. Every note/project/article card now carries its own
// `view-transition-name` (for the cross-page morph — see notes-list.tsx /
// projects-list.tsx / articles-list.tsx), and that CSS property forces its
// element into a permanent stacking context per spec, same as `transform`
// or `opacity < 1` — unlike the reveal animation's transform, this one
// never gets removed after mount. A later card (or SectionHeader's own
// named heading) sharing that same "no explicit z-index" stacking level
// then paints over an earlier card's whole stacking context, popover and
// all, by document order. Portaling to `document.body` sidesteps every
// ancestor's stacking context entirely, so this can't recur no matter how
// many more elements pick up their own `view-transition-name` later.
function ActionPopover({
  action,
  align,
  anchorRect,
  platforms,
  getDirectUrl,
  composeText,
  shareUrl,
  contentType,
  contentId,
  onClose,
}: BarProps & { action: InteractionAction; align: 'left' | 'right'; anchorRect: DOMRect; onClose: () => void }) {
  const meta = ACTION_META[action]
  const { hideUnavailableMirrors } = useDesignToggles()
  const popoverRef = useRef<HTMLDivElement>(null)
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

  const targets = platforms
    .map((platform) => ({
      platform,
      target: getInteractionTarget(platform, { directUrl: getDirectUrl(platform), composeText, action }),
    }))
    .filter(
      (t): t is { platform: InteractionPlatform; target: NonNullable<ReturnType<typeof getInteractionTarget>> } =>
        t.target !== null,
    )
    // "profile" is a weak fallback (just "go to my account", not an action
    // on THIS post) for reply/repost/like/share — hidden by default via the
    // dev toggle since it can't actually do what the button promised.
    // `follow` is exempt: a profile link IS the correct, intended target
    // for following someone, not a fallback standing in for something
    // better, so this toggle hiding it would silently empty the whole
    // Follow popover.
    .filter((t) => action === 'follow' || !hideUnavailableMirrors || t.target.kind !== 'profile')

  const canWebShare = action === 'share' && typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  function shareViaDevice() {
    navigator
      .share({ text: composeText, url: shareUrl })
      .catch(() => {
        // user cancelled the native share sheet — not an error
      })
    trackInteraction(contentType, contentId, action, 'web-share')
    onClose()
  }

  const top = anchorRect.bottom + 6
  const left = align === 'left' ? anchorRect.left : undefined
  const right = align === 'right' ? window.innerWidth - anchorRect.right : undefined

  return createPortal(
    <div
      ref={popoverRef}
      // Fixed + viewport coordinates from `anchorRect`, not `absolute`
      // relative to a DOM parent — see the component comment above for why.
      // Scales/fades in from its anchor corner — origin matches `align` so
      // it visibly grows out of the button that opened it, not the middle
      // of nowhere.
      style={{ position: 'fixed', top, left, right }}
      className={`z-50 ${align === 'left' ? 'origin-top-left' : 'origin-top-right'}
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
              trackInteraction(contentType, contentId, action, platform)
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
    </div>,
    document.body,
  )
}

// Shared by InteractionButton (the action row) and the author avatar/name
// trigger (notes-list.tsx) — anything that needs to open one of these
// platform-list popovers anchored to itself. Owns the open/close state,
// the anchor-rect capture, and the outside-click dismissal; the caller only
// supplies what to render as the trigger and which action/platforms it
// opens.
function usePopoverTrigger<T extends HTMLElement>() {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<T>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  function openPopover() {
    if (triggerRef.current) setAnchorRect(triggerRef.current.getBoundingClientRect())
    setOpen(true)
  }
  function closePopover() {
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    // The popover itself now renders through a portal outside `triggerRef`'s
    // own subtree (see ActionPopover above), so "outside" has to mean
    // outside BOTH the trigger and the portaled popover — checking only the
    // trigger would treat every click inside the popover as outside and
    // close it before its own link/button click can register.
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      closePopover()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return { open, anchorRect, triggerRef, popoverRef, openPopover, closePopover }
}

function InteractionButton({
  action,
  align,
  large,
  ...barProps
}: BarProps & { action: InteractionAction; align: 'left' | 'right' }) {
  const meta = ACTION_META[action]
  const { shareIcon } = useDesignToggles()
  const icon = meta.icon ?? SHARE_ICON[shareIcon]
  const { open, anchorRect, triggerRef, popoverRef, openPopover, closePopover } = usePopoverTrigger<HTMLButtonElement>()

  return (
    <>
      <button
        ref={triggerRef}
        title={meta.label}
        aria-label={meta.label}
        onClick={() => {
          if (open) {
            closePopover()
            return
          }
          trackInteraction(barProps.contentType, barProps.contentId, action)
          openPopover()
        }}
        className={`${large ? 'w-14 h-14' : 'w-10 h-10'} flex items-center justify-center rounded-full
                    text-faint-light dark:text-faint-dark duration-150 ${meta.hoverClass} ${open ? meta.hoverClass : ''}`}
      >
        <i className={`${icon} ${large ? 'text-[1.75rem]' : 'text-l'}`} />
      </button>
      {open && anchorRect && (
        <ActionPopoverWithRef
          popoverRef={popoverRef}
          action={action}
          align={align}
          anchorRect={anchorRect}
          onClose={closePopover}
          {...barProps}
        />
      )}
    </>
  )
}

// ActionPopover needs its own ref forwarded out to the trigger's
// outside-click check (see usePopoverTrigger) — a thin wrapper rather than
// making every ActionPopover caller deal with ref-forwarding directly.
function ActionPopoverWithRef({
  popoverRef,
  ...props
}: BarProps & {
  action: InteractionAction
  align: 'left' | 'right'
  anchorRect: DOMRect
  onClose: () => void
  popoverRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <span ref={popoverRef as React.RefObject<HTMLSpanElement>} className="contents">
      <ActionPopover {...props} />
    </span>
  )
}

// The one interaction row — like/reply/repost/share, each opening a popover
// of platforms it can actually do something real on. Used identically by
// notes and articles (articles just pass a wider `platforms` list — see
// ARTICLE_INTERACTION_PLATFORMS in interactions.ts — since a reader might
// want to discuss a longform piece on either its own mirrors or the
// short-form platforms).
export function InteractionBar(props: BarProps) {
  // Left/right split matches visual position in the row below — reply and
  // repost sit toward the left edge of the card, like/share/follow toward
  // the right, so their popovers grow inward from whichever edge they're near.
  const actions: { action: InteractionAction; align: 'left' | 'right' }[] = [
    { action: 'reply', align: 'left' },
    { action: 'repost', align: 'left' },
    { action: 'like', align: 'right' },
    { action: 'share', align: 'right' },
    ...(props.showFollow ? ([{ action: 'follow', align: 'right' }] as const) : []),
  ]

  // `w-full` (not just `max-w-*`) — the bottom-of-article bar sits inside a
  // `flex justify-center` wrapper, which sizes a flex-item child to its
  // content by default instead of stretching it; without an explicit
  // width, `max-w` never has anything to cap and `justify-between` has no
  // extra space to distribute, leaving the buttons bunched together
  // instead of spread across the row.
  return (
    <div className={`flex items-center justify-between w-full ${props.large ? 'max-w-lg -ml-3.5' : 'max-w-xs -ml-2.5'}`}>
      {actions.map(({ action, align }) => (
        <InteractionButton key={action} action={action} align={align} {...props} />
      ))}
    </div>
  )
}

// The author avatar/name in a note card (or anywhere else with an author
// byline) opens the same Follow popover as the interaction bar's own Follow
// button — on click, or after hovering for half a second. `platforms`
// should be the full blog + short-form union (ARTICLE_INTERACTION_PLATFORMS)
// regardless of which platforms the surrounding content type otherwise
// interacts on, since following the author isn't scoped to this one post.
export function AuthorFollowTrigger({
  platforms,
  contentType,
  contentId,
  className,
  children,
}: {
  platforms: InteractionPlatform[]
  contentType: string
  contentId: string
  className?: string
  children: ReactNode
}) {
  const { open, anchorRect, triggerRef, popoverRef, openPopover, closePopover } = usePopoverTrigger<HTMLDivElement>()
  const HOVER_DELAY_MS = 500
  const MIN_VISIBLE_MS = 500
  // Pending "open after hovering long enough" timer, distinct from
  // `hideTimer` below (the "close after having been visible long enough"
  // one) — separate refs since both can be in flight at different times.
  const hoverOpenTimer = useRef<ReturnType<typeof setTimeout>>()
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  // 'click' popovers only close via another click or the outside-click
  // handler in usePopoverTrigger — mouse leaving should never close them.
  // 'hover' popovers close when the cursor leaves, but not before they've
  // been on screen for MIN_VISIBLE_MS, so a quick pass-over doesn't flash
  // the popover in and immediately back out.
  const openedByRef = useRef<'hover' | 'click' | null>(null)
  const openedAtRef = useRef(0)

  useEffect(
    () => () => {
      clearTimeout(hoverOpenTimer.current)
      clearTimeout(hideTimer.current)
    },
    [],
  )

  function handleClick() {
    clearTimeout(hoverOpenTimer.current)
    clearTimeout(hideTimer.current)
    if (open) {
      openedByRef.current = null
      closePopover()
    } else {
      openedByRef.current = 'click'
      openPopover()
    }
  }

  function handleMouseEnter() {
    // Re-entering before a pending hover-close fired cancels it — the
    // popover was still technically "open" the whole time, just counting
    // down, so hovering back over its trigger should just keep it open.
    clearTimeout(hideTimer.current)
    if (open) return
    hoverOpenTimer.current = setTimeout(() => {
      openedByRef.current = 'hover'
      openedAtRef.current = performance.now()
      openPopover()
    }, HOVER_DELAY_MS)
  }

  function handleMouseLeave() {
    clearTimeout(hoverOpenTimer.current)
    if (!open || openedByRef.current !== 'hover') return
    const remaining = MIN_VISIBLE_MS - (performance.now() - openedAtRef.current)
    if (remaining <= 0) {
      closePopover()
    } else {
      hideTimer.current = setTimeout(closePopover, remaining)
    }
  }

  return (
    <div
      ref={triggerRef}
      className={`cursor-pointer ${className ?? ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {open && anchorRect && (
        <ActionPopoverWithRef
          popoverRef={popoverRef}
          action="follow"
          align="left"
          anchorRect={anchorRect}
          onClose={closePopover}
          contentType={contentType}
          contentId={contentId}
          platforms={platforms}
          getDirectUrl={() => undefined}
          composeText=""
          shareUrl=""
        />
      )}
    </div>
  )
}
