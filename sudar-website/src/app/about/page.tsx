import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Target, Heart, Globe, Sparkles, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: '概要',
  description: '知恵塾のミッション - すべての人にパーソナライズされたアダプティブラーニングを民主化する。',
}

const timeline = [
  {
    year: '2024',
    title: 'ビジョン',
    description: '知恵塾は、教育の世界を修正し、アダプティブラーニングを誰もが利用できるようにするという、一人のビルダーのビジョンから始まりました。',
  },
  {
    year: '2025',
    title: '基盤構築',
    description: 'クリエイター向けのStudio、学習者向けのLearn、AIブレインとしてのIntelligenceという3つのコアサーフェスをローンチ。',
  },
  {
    year: '2026',
    title: 'オープンソースリリース',
    description: '知恵塾はApache-2.0の下で完全にオープンソース化。$0でのセルフホストが現実に。',
  },
  {
    year: '未来',
    title: 'インパクトの拡大',
    description: 'ALPプラグイン、より多くのモダリティで拡張し、世界中の組織にリーチ。',
  },
]

const values = [
  {
    icon: Target,
    title: '学習者ファースト',
    description: 'すべての決定において「これは学習者の体験を良くするか？」を問います。それ以外は重要ではありません。',
  },
  {
    icon: Heart,
    title: '民主化',
    description: '世界クラスの学習ツールにエンタープライズ予算は必要ありません。オープンソースがアクセシビリティを保証します。',
  },
  {
    icon: Globe,
    title: 'グローバルインパクト',
    description: 'あらゆるコンテキストで、あらゆる場所の学習者のために構築。モバイルファースト、オフライン対応、多言語対応。',
  },
  {
    icon: Sparkles,
    title: 'イノベーション',
    description: 'AIネイティブラーニングで限界を突破。古い手法を自動化するだけでなく、再構想します。',
  },
]

const team = [
  {
    name: 'Dhanikesh Karunanithi',
    role: 'クリエイター＆メンテナー',
    bio: 'アダプティブラーニングを誰もが利用できるようにすることに情熱を持つソロビルダー。',
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
              知恵塾の{' '}
              <span className="text-primary">ストーリー</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              パーソナライズされた学習を民主化するために構築。学習者を学習するひとつのプラットフォーム。
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
                知恵塾が存在する理由
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>
                  従来の学習管理システムは、同じコンテンツを全員に配信します。学習者が誰であるかを記憶しません。
                  行動や事前知識に基づいて順序、難易度、サポートを適応させることはありません。
                </p>
                <p>
                  長年、アダプティブな指導とインテリジェントなチューティングがワンサイズフィットオールの配信を
                  上回ることが研究で示されてきましたが、主流のLMS製品は依然として縦断的な学習者モデルや
                  記憶対応チューティングを提供していません。
                </p>
                <p>
                  <span className="font-semibold text-gray-900 dark:text-white">知恵塾がそのギャップを埋めます。</span> 
                  一人のビルダーのビジョンとして始まりました：オーサリング、配信、インテリジェンスを
                  永続的なデジタル学習ツインの周りに統一し、これまで一部の人にしか利用できなかった
                  アダプティブでインテリジェントな教育をすべての学習者に提供するプラットフォーム。
                </p>
              </div>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="https://learn.rhgj.jp">
                  始めましょう
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button href="/research" variant="outline">
                  研究を読む
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 rounded-2xl p-12 backdrop-blur-sm">
                <div className="text-center">
                  <p className="text-lg italic text-gray-700 dark:text-gray-300 mb-4">
                    「あなたと共に、あなたのために学びます。」
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    — 知恵塾のコアプロミス
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
              3つのサーフェス、1つのビジョン
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Studio、Learn、Intelligenceがひとつの学習者モデルの周りで連携。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                name: '知恵塾 Studio',
                description: '管理・クリエイター向けサーフェス。ドキュメント、URL、プロンプトからコースを構築。AIが構造とコンテンツを生成。Learnに公開。',
              },
              {
                step: '02',
                name: '知恵塾 Learn',
                description: '学習者向け配信サーフェス。パーソナライズされたダッシュボード、モダリティ選択、AIチューター - すべてデジタル学習ツインが駆動。',
              },
              {
                step: '03',
                name: '知恵塾 Intelligence',
                description: 'AIブレイン。アダプティブエンジン、縦断的記憶、ネクストベストアクション、チューター「知恵塾」 - 好奇心旺盛で温かく知識豊か。',
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
              私たちの信念
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
              ジャーニー
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
              ビルダー
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              知恵塾は愛情と情熱を持って開発されたソロビルドプロジェクトです。
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
            今日から学習を始めましょう
          </h2>
          <p className="text-xl text-white/90 mb-8">
            アダプティブラーニングの民主化に参加しましょう。今すぐパーソナライズされた学習ジャーニーを始めましょう。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="https://learn.rhgj.jp"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              始めましょう
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              href="/features"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              機能を探す
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
