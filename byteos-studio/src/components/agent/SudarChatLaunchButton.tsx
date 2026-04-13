'use client'

import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { cn } from '@/lib/utils'

/**
 * Floating control to open Sudar chat: squircle plate + mark (aligns with 12–24px brand radius, not a full circle FAB).
 */
export function SudarChatLaunchButton({ className, ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      type="button"
      whileHover={{
        y: -4,
        scale: 1.04,
        transition: { type: 'spring', stiffness: 420, damping: 24 },
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 460, damping: 28 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center',
        'rounded-2xl border border-primary/25 bg-primary/10 text-primary',
        'shadow-xl backdrop-blur-md transition-[box-shadow,background-color,border-color] duration-300',
        'hover:border-primary/45 hover:bg-primary/18',
        'hover:shadow-[0_14px_40px_-12px_color-mix(in_oklab,var(--primary)_35%,transparent)]',
        'motion-reduce:backdrop-blur-none motion-reduce:hover:shadow-xl',
        className
      )}
      {...props}
    >
      <SudarLogoMark className="h-7 w-auto md:h-8" starFill="var(--background)" animated />
    </motion.button>
  )
}
