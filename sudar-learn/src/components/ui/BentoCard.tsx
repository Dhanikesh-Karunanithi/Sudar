import { cn } from '@/lib/utils'

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outline'
  as?: 'div' | 'article' | 'section'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

const variantMap = {
  default: 'bg-card border border-border text-card-foreground',
  elevated: 'bg-card border border-border shadow-md text-card-foreground',
  outline: 'bg-transparent border border-border text-card-foreground',
}

export function BentoCard({
  children,
  className,
  padding = 'md',
  variant = 'default',
  as: Component = 'div',
}: BentoCardProps) {
  return (
    <Component
      className={cn(
        'rounded-card-lg transition-all duration-200',
        paddingMap[padding],
        variantMap[variant],
        className
      )}
    >
      {children}
    </Component>
  )
}
