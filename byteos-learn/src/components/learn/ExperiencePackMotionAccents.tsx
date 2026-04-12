'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ExperiencePackSlug } from '@/lib/themes/experiencePacks'

/** Lazy-loaded Framer accents; only mounted when immersive mode is on. */
export default function ExperiencePackMotionAccents({
  pack,
}: {
  pack: Exclude<ExperiencePackSlug, 'none'>
}) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pack === 'ocean' && (
        <>
          <motion.div
            className="absolute -left-[10%] top-1/4 h-64 w-64 rounded-full bg-cyan-500/[0.07] blur-3xl"
            animate={{ y: [0, -12, 0], opacity: [0.5, 0.75, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-[5%] bottom-0 h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-3xl"
            animate={{ y: [0, 14, 0], opacity: [0.45, 0.65, 0.45] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </>
      )}
      {pack === 'forest' && (
        <>
          <motion.div
            className="absolute left-1/4 top-0 h-56 w-56 rounded-full bg-emerald-500/[0.09] blur-3xl"
            animate={{ x: [0, 8, 0], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-1/3 bottom-1/4 h-48 w-48 rounded-full bg-amber-600/[0.06] blur-3xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
      {pack === 'space' && (
        <>
          <motion.div
            className="absolute left-1/2 top-1/3 h-px w-[120%] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/20 to-transparent"
            animate={{ opacity: [0.2, 0.5, 0.2], rotate: [0, 1, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[15%] top-[20%] h-32 w-32 rounded-full bg-violet-500/[0.07] blur-3xl"
            animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}
    </div>
  )
}
