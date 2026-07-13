import { CSSProperties, useEffect, useState } from 'react'
import { NoteMeta } from '../note'
import { NOTE_INTERACTION_PLATFORMS } from '../interactions'
import { relativeTime } from '../relative-time'
import { useDesignToggles } from '../design-toggles'
import { useReveal } from './reveal'
import { InteractionBar, AuthorFollowTrigger } from './interaction-bar'
import { Spotlight, mergeRefs, useSpotlight } from './spotlight'

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

// Per-note, not a single shared "hero" name — every note rendered on both
// the homepage preview and the full /notes page carries its own id-derived
// name, so the browser morphs every card that appears on both sides, not
// just whichever one happened to be first. A no-op (unmatched name) for a
// note that only exists on one side.
function noteCardTransitionStyle(noteId: string): CSSProperties {
  return { viewTransitionName: `note-card-${noteId}` } as CSSProperties
}

function NoteCard({ note, cardClass }: { note: NoteMeta; cardClass: string }) {
  // Applied directly to the outer element (border/background/id and all) —
  // not just to a wrapper around the inner content. Wrapping only the
  // content meant the border/background box appeared instantly and only
  // the text/avatar inside it faded in, which looked like the reveal
  // wasn't really happening — the box is most of what's visible here.
  const reveal = useReveal<HTMLDivElement>()
  const spotlight = useSpotlight<HTMLDivElement>()

  return (
    <div
      ref={mergeRefs(reveal.ref, spotlight.ref)}
      onMouseMove={spotlight.onMouseMove}
      id={note.id}
      className={`${cardClass} duration-150 ${reveal.className} relative group`}
      style={noteCardTransitionStyle(note.id)}
    >
      <Spotlight />
      <div className="flex gap-3">
        {/* Two independent trigger instances, not one wrapping both — the
            avatar and the name aren't adjacent in the DOM (the name sits
            inside the meta row next to the date/pin badges, matching the
            original layout), so each gets its own hover/click zone opening
            the same Follow popover, the way most feeds treat "hover the
            avatar" and "hover the name" as two equally-valid triggers.
            Short-form platforms only (NOTE_INTERACTION_PLATFORMS) — a note
            is short-form content, so following "the author of this" means
            following on the short-form platforms it's actually posted to,
            not the longread/blog mirrors (Medium, Hashnode, Dev.to, Habr)
            that have nothing to do with this piece of content. */}
        <AuthorFollowTrigger
          contentType="note"
          contentId={note.id}
          platforms={NOTE_INTERACTION_PLATFORMS}
          className="shrink-0"
        >
          <img src="/mark-parker.jpg" alt="" className="w-9 h-9 rounded-full mt-0.5 object-cover" />
        </AuthorFollowTrigger>
        <div className="min-w-0 flex-1 font-sans">
          <div className="flex items-center gap-1.5 flex-wrap">
            <AuthorFollowTrigger contentType="note" contentId={note.id} platforms={NOTE_INTERACTION_PLATFORMS}>
              <span className="font-semibold text-primary-light dark:text-primary-dark hover:underline">
                Mark Parker
              </span>
            </AuthorFollowTrigger>
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
          <div className="mt-1">
            <InteractionBar
              contentType="note"
              contentId={note.id}
              platforms={NOTE_INTERACTION_PLATFORMS}
              getDirectUrl={(platform) => note.mirrors.find((m) => m.platform === platform)?.url}
              composeText={note.body}
              shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/notes#${note.id}`}
            />
          </div>
        </div>
      </div>
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

  // A cursor-following radial glow (see ./spotlight), not a flat bg-color
  // fill — same restraint as the project cards now use, so the two content
  // types share one hover language instead of each inventing its own.
  // No `rounded-lg` on the divider variant — border-radius on a box with
  // only a bottom border curves the border-b line itself inward at both
  // ends instead of a flat edge-to-edge divider.
  const cardClass =
    cardStyle === 'border'
      ? 'border rounded-xl px-4 pt-3 pb-2 hover:shadow-sm'
      : 'border-b last:border-b-0 px-1 pt-3 pb-3 first:pt-0'

  return (
    <div className={`mx-auto max-w-xl flex flex-col ${cardStyle === 'border' ? 'gap-3' : ''}`}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} cardClass={cardClass} />
      ))}
    </div>
  )
}
