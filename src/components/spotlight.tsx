import { MutableRefObject, Ref, useRef } from 'react'

// Combines two refs onto one DOM node — a card needs both `useReveal`'s ref
// (scroll animation) and `useSpotlight`'s ref (cursor tracking) on the same
// element, and React only accepts a single `ref` prop.
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return
      if (typeof ref === 'function') ref(node)
      else (ref as MutableRefObject<T | null>).current = node
    })
  }
}

// Tracks the cursor position relative to the element itself (not the
// viewport) and writes it straight to two CSS custom properties on the DOM
// node via `onMouseMove` — no React state/re-render in the hot path, since
// this fires on every pixel of mouse movement.
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  function onMouseMove(e: { clientX: number; clientY: number }) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return { ref, onMouseMove }
}

// A large, soft radial glow centered on the last-known cursor position
// (--spot-x/--spot-y, set by useSpotlight above) — Material's hover
// treatment, not a flat background fill. Two copies (not one gradient with
// a CSS-variable color) because the gradient's rgba() can't reach a
// Tailwind `dark:` variant on its own; `dark:hidden`/`hidden dark:block`
// picks between them instead. Needs a `relative group` ancestor: `relative`
// so `inset-0` anchors here rather than the page, `group` so
// `group-hover:opacity-100` can fade it in. Deliberately NOT
// `overflow-hidden` on that ancestor — a background always clips to its own
// box's border-radius regardless (no overflow-hidden needed for that), and
// the ancestor is also where each card's popovers get positioned; clipping
// it there cut the popovers off along with the glow.
export function Spotlight() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100
                   transition-opacity duration-500 dark:hidden"
        style={{
          background:
            'radial-gradient(570px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(0,0,0,0.036), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 group-hover:opacity-100
                   transition-opacity duration-500 hidden dark:block"
        style={{
          background:
            'radial-gradient(570px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,255,255,0.054), transparent 70%)',
        }}
      />
    </>
  )
}
