'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Video, Headphones, Map, Layers, Gamepad2, 
  Play, Sparkles, MessageSquare, BarChart3, Shield, Globe,
  Clock, Users, CheckCircle, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

const modalities = [
  { icon: FileText, name: 'Reading', description: 'Traditional text-based learning' },
  { icon: Video, name: 'Video', description: 'AI-generated video content' },
  { icon: Headphones, name: 'Audio', description: 'Podcast-style narration' },
  { icon: Map, name: 'MindMap', description: 'Visual concept mapping' },
  { icon: Layers, name: 'Flashcards', description: 'Spaced repetition cards' },
  { icon: Play, name: '知恵塾 Feed', description: 'TikTok-style micro-learning' },
  { icon: Gamepad2, name: '知恵塾 Play', description: 'Gamified learning experiences' },
]

const studioFeatures = [
  { icon: FileText, title: 'Document-to-Course', description: 'Upload PDF, DOCX, or paste a URL' },
  { icon: Sparkles, title: 'AI Generation', description: 'Course structure and content in minutes' },
  { icon: Layers, title: '14 Visual Templates', description: 'Beautiful, professional designs' },
  { icon: Globe, title: 'Multi-Source Media', description: 'Google, Pexels, Unsplash, Giphy' },
  { icon: CheckCircle, title: 'SCORM Export', description: 'Compatible with any LMS' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Track completions and skill gaps' },
]

const learnFeatures = [
  { icon: MessageSquare, title: 'AI Tutor "知恵塾"', description: 'Personal tutor with memory' },
  { icon: Users, title: 'Digital Learner Twin', description: 'Your learning profile evolves' },
  { icon: ArrowRight, title: 'Next Best Action', description: 'AI recommends what to do next' },
  { icon: Clock, title: 'Learning Streaks', description: 'Stay motivated with streaks' },
  { icon: Shield, title: 'Compliance Tracking', description: 'Certifications and due dates' },
  { icon: Globe, title: 'Mobile-First', description: 'Learn anywhere, anytime' },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
            One Platform, <span className="text-primary">Infinite Possibilities</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            知恵塾 unifies course creation, delivery, and intelligent adaptation in one seamless experience.
          </p>
        </motion.div>

        {/* Three Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          {[
            { name: 'Studio', role: 'Create', description: 'Build courses in minutes with AI-powered authoring' },
            { name: 'Learn', role: 'Deliver', description: 'Personalized, adaptive learning experiences' },
            { name: 'Intelligence', role: 'Adapt', description: 'AI brain that learns every learner' },
          ].map((pillar, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 p-8 text-center"
            >
              <div className="text-sm font-semibold text-primary dark:text-primary-light mb-2 uppercase tracking-wider">
                {pillar.role}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 font-serif">
                知恵塾 {pillar.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Modalities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center font-serif">
            Seven Learning Modalities
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Content is authored once, then delivered in the format that works best for each learner.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {modalities.map((modality, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
                  <modality.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {modality.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {modality.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Studio Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
                知恵塾 Studio
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                For L&D teams and content creators
              </p>
            </div>
            <Link
              href="/features/studio"
              className="hidden sm:flex items-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary font-medium transition-colors"
            >
              Learn more <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studioFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start space-x-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary dark:text-primary-light" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Learn Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
                知恵塾 Learn
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                For learners and training participants
              </p>
            </div>
            <Link
              href="/features/learn"
              className="hidden sm:flex items-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary font-medium transition-colors"
            >
              Learn more <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learnFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start space-x-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-accent dark:text-accent-light" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
