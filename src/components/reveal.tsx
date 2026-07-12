import { useEffect, useRef, useState, PropsWithChildren } from 'react'

// Fade + slide up as a block enters the viewport — the "sections arrive as
// you scroll" pattern (parker-industries.org uses the same idea). Plain
// IntersectionObserver + CSS transition, no new dependency (no
// framer-motion) — this site has stayed deliberately dependency-light, and
// a one-shot reveal doesn't need a physics engine.
export function Reveal({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect the user's OS-level motion preference — reveal immediately,
    // no fade/slide, rather than force motion on someone who's opted out.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      // Fires a little before the block is fully in view, and only once —
      // this is an entrance, not a repeating scroll-linked effect.
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}
