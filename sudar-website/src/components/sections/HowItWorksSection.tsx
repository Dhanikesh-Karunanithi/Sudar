'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, Wand2, Rocket, Users, Brain, BarChart,
  ArrowRight, CheckCircle, Sparkles
} from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: '数分で作成',
    description: 'PDFをアップロードするかURLを貼り付けるだけ。AIがコース構造、コンテンツ、クイズを生成。インストラクショナルデザイナーは不要です。',
    color: 'from-orange-500 to-red-500',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'カスタマイズ＆ブランディング',
    description: '14のビジュアルテンプレートから選択。コンテンツを編集、メディアを追加、組織のブランディングに合わせてリアルタイムプレビュー。',
    color: 'from-primary to-purple-500',
  },
  {
    number: '03',
    icon: Rocket,
    title: '公開＆登録',
    description: 'ワンクリックで知恵塾 Learnに公開。チームに割り当て、期限を設定、進捗を自動追跡。',
    color: 'from-accent to-blue-500',
  },
  {
    number: '04',
    icon: Brain,
    title: 'AIが学習を適応',
    description: 'デジタル学習ツインが行動を観察。知恵塾がモダリティ、ペース、難易度を各個人に適応させます。',
    color: 'from-pink-500 to-rose-500',
  },
]

const benefits = [
  '従来のオーサリングツールと比較して15分 vs 15週間',
  'インストラクショナルデザインの専門知識は不要',
  'すべての学生にパーソナライズされた学習',
  'リアルタイム分析とスキルギャップ検出',
  'オープンソースでセルフホスト$0',
  '既存のLMSとSCORM互換',
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-gray-50 dark:bg-gray-800">
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
            仕組みは<span className="text-primary">シンプル</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            ドキュメントからデプロイ済みコースまで、4つのステップで完了。知恵塾が複雑さを処理するので、あなたは結果に集中できます。
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700 z-0" />
              )}
              
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-full">
                {/* Badge */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Number badge */}
                <div className="absolute top-6 right-6 text-5xl font-bold text-gray-100 dark:text-gray-800 font-mono">
                  {step.number}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 lg:p-12 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-8">
            <Sparkles className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              組織が知恵塾を選ぶ理由
            </h3>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
