'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, BookOpen, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const ctaOptions = [
  {
    icon: Zap,
    title: '学習を始める',
    description: 'VercelとRailwayの無料枠にデプロイ。SupabaseとAIの使用量のみお支払い。',
    href: 'https://learn.rhgj.jp',
    primary: true,
    external: true,
  },
  {
    icon: BookOpen,
    title: '機能を探す',
    description: '学習をアダプティブで魅力的にするすべての機能を発見。',
    href: '/features',
    external: false,
  },
  {
    icon: Users,
    title: '料金を見る',
    description: 'チームと組織のためのシンプルで透明な料金設定。',
    href: '/pricing',
    external: false,
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
            <span>オープンソース • Apache-2.0 ライセンス</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-serif">
            学習を変革する準備はできましたか？
          </h2>
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
            知恵塾を使ってパーソナライズされたアダプティブラーニング体験を
            提供している数千の教育者や組織に参加しましょう。今日から始めましょう。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="https://learn.rhgj.jp"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100"
            >
              無料で始める
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              href="/about"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              詳しく見る
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
