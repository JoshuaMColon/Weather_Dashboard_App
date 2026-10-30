import type { ReactNode } from 'react'

/** Frosted-glass card with the small uppercase header iOS Weather uses. */
export function Card({ icon, title, children, className = '', id }: { icon?: ReactNode; title?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={`glass rounded-[22px] px-4 py-3 ${className}`} aria-label={title} id={id}>
      {title && (
        <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-white/80">
          {icon}
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
