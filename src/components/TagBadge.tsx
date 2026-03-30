import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  active?: boolean
  onClick?: () => void
  href?: string
  className?: string
}

export function TagBadge({ tag, active, onClick, href, className }: TagBadgeProps) {
  const baseClass = cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
    active
      ? 'bg-accent text-white'
      : 'bg-accent-light text-accent hover:bg-accent hover:text-white',
    onClick && 'cursor-pointer',
    className
  )

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {tag}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={baseClass}>
        {tag}
      </button>
    )
  }

  return <span className={baseClass}>{tag}</span>
}
