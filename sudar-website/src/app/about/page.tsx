import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Target, Heart, Globe, Sparkles, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about 知恵塾\'s mission to democratize personalized, adaptive learning for everyone.',
}

const timeline = [
  {
    year: '2024',
    title: 'The Vision',
    description: '知恵塾 started as a solo builder\'s vision to fix the world of education and make adaptive learning accessible to everyone.',
  },
  {
    year: '2025',
    title: 'Foundation Built',
    description: 'Three core surfaces launched: Studio for creators, Learn for learners, and Intelligence as the AI brain.',
  },
  {
    year: '2026',
    title: 'Open Source Release',
    description: '知恵塾 became fully open source under Apache-2.0. Self-host at $0 became a reality.',
  },
  {
    year: 'Future',
    title: 'Scaling Impact',
    description: 'Expanding with ALP plugins, more modalities, and reaching organizations worldwide.',
  },
]

const values = [
  {
    icon: Target,
    title: 'Learner-First',
    description: 'Every decision asks: "Does this make the learner\'s experience better?" Nothing else matters.',
  },
  {
    icon: Heart,
    title: 'Democratization',
    description: 'World-class learning tools shouldn\'t require enterprise budgets. Open source keeps it accessible.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Building for learners everywhere, in every context. Mobile-first, offline-capable, multilingual.',
  },
  {
    icon: Sparkles,
    title: 'Innovation',
    description: 'Pushing boundaries with AI-native learning. Not just automating old methods, but reimagining them.',
  },
]

const team = [
  {
    name: 'Dhanikesh Karunanithi',
    role: 'Creator & Maintainer',
    bio: 'Solo builder passionate about making adaptive learning accessible to everyone.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-20 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-gray-900 dark:to-accent/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
              The Story Behind{' '}
              <span className="text-primary">知恵塾</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Built to democratize personalized learning. One platform that learns the learner.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
                Why 知恵塾 Exists
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  Traditional learning management systems deliver the same content to everyone. They don't remember 
                  who the learner is. They don't adapt sequence, difficulty, or support based on behavior or prior knowledge.
                </p>
                <p>
                  Research has shown for years that adaptive instruction and intelligent tutoring outperform 
                  one-size-fits-all delivery — yet mainstream LMS products still don't offer a longitudinal 
                  learner model or memory-aware tutoring.
                </p>
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">知恵塾 closes that gap.</span> It started as a solo 
                  builder's vision: one platform that unifies authoring, delivery, and intelligence around a 
                  persistent Digital Learner Twin, so that every learner can get the kind of adaptive, 
                  intelligent education that was previously reserved for the few.
                </p>
              </div>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="https://learn.rhgj.jp">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button href="/research" variant="outline">
                  Read the Research
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 rounded-2xl p-12 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-lg italic text-gray-700 dark:text-gray-300 mb-4">
                    "Learns with you, for you."
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    — 知恵塾's Core Promise
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Surfaces */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Three Surfaces, One Vision
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Studio, Learn, and Intelligence work together around one learner model.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                name: '知恵塾 Studio',
                description: 'Admin and creator surface. Build courses from documents, URLs, or prompts. AI generates structure and content. Publish to Learn.',
              },
              {
                step: '02',
                name: '知恵塾 Learn',
                description: 'Learner-facing delivery. Personalized dashboard, modality choice, and the AI tutor — all driven by the Digital Learner Twin.',
              },
              {
                step: '03',
                name: '知恵塾 Intelligence',
                description: 'The AI brain. Adaptive engine, longitudinal memory, next-best-action, and the tutor "知恵塾" — curious, warm, and knowledgeable.',
              },
            ].map((surface, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-6 right-6 text-6xl font-bold text-gray-100 dark:text-gray-800 font-mono">
                  {surface.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
                  {surface.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {surface.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              What We Believe
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              The Journey
            </h2>
          </div>

          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-24">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light text-sm font-semibold">
                    {item.year}
                  </span>
                </div>
                <div className="flex-grow bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              The Builder
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              知恵塾 is a solo-built project, developed with care and passion.
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-primary dark:text-primary-light font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 font-serif">
            Start Learning Today
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join us in democratizing adaptive learning. Start your personalized learning journey now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="https://learn.rhgj.jp"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              href="/features"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              Explore Features
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
