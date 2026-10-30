import { useEffect, type RefObject } from 'react'

/**
 * Pauses the CSS animations of every animated icon (`svg.wxi`) inside `ref`
 * while that icon is out of view, including icons scrolled sideways out of the
 * hourly strip, so off-screen icons cost nothing. Icons added later (e.g. as a
 * city card's data arrives) are picked up automatically.
 */
export function usePauseOffscreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as SVGElement
        if (e.isIntersecting) delete el.dataset.animPaused
        else el.dataset.animPaused = ''
      }
    })
    const seen = new WeakSet<Element>()
    const scan = () =>
      root.querySelectorAll<SVGElement>('svg.wxi').forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        io.observe(el)
      })
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [ref])
}
