import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  active?: boolean
  onClick?: () => void
  className?: string
}

export function TagBadge({ tag, active, onClick, className }: TagBadgeProps) {
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
        active
          ? 'bg-accent text-white'
          : 'bg-accent-light text-accent hover:bg-accent hover:text-white',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {tag}
    </Component>
  )
}
