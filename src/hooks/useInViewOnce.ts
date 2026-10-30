import { useEffect, useState, type RefObject } from 'react'

/** True once the element has been at least partly visible. */
export function useInViewOnce(ref: RefObject<Element | null>, threshold = 0.35) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') {
      const id = requestAnimationFrame(() => setSeen(true))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen, threshold])
  return seen
}
