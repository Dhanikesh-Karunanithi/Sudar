'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Users, BookOpen, Brain, Zap, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const stats = [
  { label: '作成されたコース', value: '10,000+' },
  { label: 'アクティブ学習者', value: '50,000+' },
  { label: '組織', value: '500+' },
  { label: '国', value: '30+' },
]

const features = [
  {
    icon: Brain,
    title: 'デジタル学習ツイン',
    description: 'あなたの学習スタイルや好みを学習し、リアルタイムでコンテンツを適応させるAI。',
  },
  {
    icon: Sparkles,
    title: '記憶するAIチューター',
    description: '知恵塾にお任せ - セッションを越えてすべての会話を記憶するパーソナルチューター。',
  },
  {
    icon: BookOpen,
    title: 'マルチモーダル配信',
    description: '1つのコース、7つの形式：テキスト、ビデオ、オーディオ、マインドマップ、フラッシュカード、フィード、ゲーム。',
  },
  {
    icon: Users,
    title: 'チームコラボレーション',
    description: 'L&Dチームが大規模に学習を作成、管理、追跡するために構築されています。',
  },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-primary/10">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-full px-4 py-2 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>オープンソース • セルフホスト $0</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gray-900 dark:text-white font-serif">知恵塾</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl sm:text-3xl text-gray-600 dark:text-gray-300 font-light mb-4 italic"
          >
            学習のためのオペレーティングシステム
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            <span className="text-primary dark:text-primary-light font-semibold">あなたと共に、あなたのために学びます。</span> 数分で研修を作成、
            アダプティブに配信し、すべての学習者に記憶するチューターを提供します。
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Button href="https://learn.rhgj.jp" size="lg" className="w-full sm:w-auto">
              無料で始める
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button href="https://learn.rhgj.jp" variant="outline" size="lg" className="w-full sm:w-auto">
              <Play className="mr-2 w-5 h-5" />
              デモを見る
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
