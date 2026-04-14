'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, BookOpen, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const ctaOptions = [
  {
    icon: Zap,
    title: 'Start Learning',
    description: 'Deploy on Vercel and Railway free tiers. Only pay for your Supabase and AI usage.',
    href: 'https://learn.rhgj.jp',
    primary: true,
  },
  {
    icon: BookOpen,
    title: 'Explore Features',
    description: 'Discover all the features that make learning adaptive and engaging.',
    href: '/features',
  },
  {
    icon: Users,
    title: 'View Pricing',
    description: 'Simple, transparent pricing for teams and organizations.',
    href: '/pricing',
  },
]

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-primary via-purple-600 to-accent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Open Source • Apache-2.0 License</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-serif">
            Ready to Transform Learning?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            Join thousands of educators and organizations using 知恵塾 to deliver personalized, 
            adaptive learning experiences. Start building today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="https://learn.rhgj.jp"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              href="/about"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* CTA Options Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {ctaOptions.map((option, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Link
                href={option.href}
                target={option.external ? '_blank' : undefined}
                rel={option.external ? 'noopener noreferrer' : undefined}
                className="block h-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-4">
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {option.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
