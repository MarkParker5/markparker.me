// Plain mutable flag, not React state — read synchronously inside
// useReveal's IntersectionObserver callback at the moment it fires, with no
// need for every Reveal instance to subscribe/re-render on every change.
// Set around each route change in _app.tsx.
export const viewTransitionState = { active: false }
