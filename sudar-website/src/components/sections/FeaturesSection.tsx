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
  { icon: FileText, name: 'リーディング', description: '従来のテキストベース学習' },
  { icon: Video, name: 'ビデオ', description: 'AI生成ビデオコンテンツ' },
  { icon: Headphones, name: 'オーディオ', description: 'ポッドキャスト形式のナレーション' },
  { icon: Map, name: 'マインドマップ', description: 'ビジュアル概念マッピング' },
  { icon: Layers, name: 'フラッシュカード', description: '間隔反復カード' },
  { icon: Play, name: '知恵塾フィード', description: 'TikTok風マイクロラーニング' },
  { icon: Gamepad2, name: '知恵塾プレイ', description: 'ゲーム化学習体験' },
]

const studioFeatures = [
  { icon: FileText, title: 'ドキュメントからコース', description: 'PDF、DOCXをアップロード、またはURLを貼り付け' },
  { icon: Sparkles, title: 'AI生成', description: '数分でコース構造とコンテンツ' },
  { icon: Layers, title: '14のビジュアルテンプレート', description: '美しくプロフェッショナルなデザイン' },
  { icon: Globe, title: 'マルチソースメディア', description: 'Google、Pexels、Unsplash、Giphy' },
  { icon: CheckCircle, title: 'SCORMエクスポート', description: 'あらゆるLMSと互換' },
  { icon: BarChart3, title: '分析ダッシュボード', description: '完了率とスキルギャップを追跡' },
]

const learnFeatures = [
  { icon: MessageSquare, title: 'AIチューター「知恵塾」', description: '記憶するパーソナルチューター' },
  { icon: Users, title: 'デジタル学習ツイン', description: 'あなたの学習プロファイルが進化' },
  { icon: ArrowRight, title: 'ネクストベストアクション', description: 'AIが次にやるべきことを提案' },
  { icon: Clock, title: '学習ストリーク', description: 'ストリークでモチベーション維持' },
  { icon: Shield, title: 'コンプライアンス追跡', description: '資格認定と期限管理' },
  { icon: Globe, title: 'モバイルファースト', description: 'いつでもどこでも学習' },
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
            ひとつのプラットフォーム、<span className="text-primary">無限の可能性</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            知恵塾はコース作成、配信、インテリジェントな適応をひとつのシームレスな体験に統合します。
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
            { name: 'Studio', role: '作成', description: 'AI搭載オーサリングで数分でコースを構築' },
            { name: 'Learn', role: '配信', description: 'パーソナライズされたアダプティブラーニング体験' },
            { name: 'Intelligence', role: '適応', description: 'すべての学習者を学習するAIブレイン' },
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
            7つの学習モダリティ
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            コンテンツは一度作成するだけで、各学習者に最適な形式で配信されます。
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
                L&Dチームとコンテンツクリエイター向け
              </p>
            </div>
            <Link
              href="/features/studio"
              className="hidden sm:flex items-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary font-medium transition-colors"
            >
              詳しく見る <ArrowRight className="ml-1 w-4 h-4" />
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
                学習者と研修参加者向け
              </p>
            </div>
            <Link
              href="/features/learn"
              className="hidden sm:flex items-center text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary font-medium transition-colors"
            >
              詳しく見る <ArrowRight className="ml-1 w-4 h-4" />
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
