import { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, Sparkles, Zap, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: '料金',
  description: '知恵塾はオープンソースでセルフホスト無料。あなたの組織に最適なプランをお選びください。',
}

const plans = [
  {
    name: 'セルフホスト',
    price: '$0',
    period: '永久',
    description: 'フルコントロールを求めるチームに最適',
    icon: Zap,
    features: [
      { name: '知恵塾 Studioフルアクセス', included: true },
      { name: '知恵塾 Learnフルアクセス', included: true },
      { name: '知恵塾 Intelligenceエンジン', included: true },
      { name: '7つの学習モダリティ', included: true },
      { name: 'SCORMエクスポート/インポート', included: true },
      { name: '記憶するAIチューター', included: true },
      { name: '無制限のコース', included: true },
      { name: 'コミュニティサポート', included: true },
      { name: '優先サポート', included: false },
      { name: 'カスタム連携', included: false },
      { name: 'SLA保証', included: false },
    ],
    cta: '始めましょう',
    ctaLink: 'https://learn.rhgj.jp',
    highlighted: false,
  },
  {
    name: 'クラウドプロ',
    price: '$49',
    period: '/月',
    description: 'マネージドホスティングと優先サポート',
    icon: Sparkles,
    features: [
      { name: 'セルフホストの全機能', included: true },
      { name: 'マネージドクラウドホスティング', included: true },
      { name: '自動アップデート', included: true },
      { name: '優先メールサポート', included: true },
      { name: '高度な分析', included: true },
      { name: 'カスタムドメイン', included: true },
      { name: 'APIアクセス', included: true },
      { name: '最大500名の学習者', included: true },
      { name: 'SSO/SAML', included: false },
      { name: 'カスタム連携', included: false },
      { name: 'SLA保証', included: false },
    ],
    cta: '近日公開',
    ctaLink: '#',
    highlighted: true,
  },
  {
    name: 'エンタープライズ',
    price: 'カスタム',
    period: '',
    description: '特定のニーズを持つ大規模組織向け',
    icon: Building2,
    features: [
      { name: 'クラウドプロの全機能', included: true },
      { name: '無制限の学習者', included: true },
      { name: 'SSO/SAML連携', included: true },
      { name: 'カスタム連携', included: true },
      { name: '専任アカウントマネージャー', included: true },
      { name: '24/7電話サポート', included: true },
      { name: 'SLA保証 (99.9%)', included: true },
      { name: 'オンプレミスデプロイ', included: true },
      { name: 'カスタムトレーニング', included: true },
      { name: 'ホワイトラベルオプション', included: true },
      { name: '優先機能リクエスト', included: true },
    ],
    cta: '営業に連絡',
    ctaLink: '/contact',
    highlighted: false,
  },
]

const faqs = [
  {
    question: '知恵塾は本当に無料ですか？',
    answer: 'はい！知恵塾はApache-2.0ライセンスのオープンソースです。$0でセルフホストできます。お支払いが必要なのは、ご自身のインフラ（Vercel、Railway/Renderの無料枠で動作します）とAI APIの使用量（Together AI、OpenAIなど）のみです。',
  },
  {
    question: 'セルフホストの注意点は？',
    answer: '注意点はありません。コース、学習者、機能に制限なく全機能を利用できます。トレードオフは、デプロイ、保守、スケーリングが自己責任になることです。包括的なドキュメントを提供しています。',
  },
  {
    question: 'セルフホストに技術的な知識は必要ですか？',
    answer: '基本的な技術知識があると便利ですが、できるだけシンプルにしています。Dockerデプロイは1つのコマンドで動作し、Vercel/Railwayデプロイは十分にドキュメント化されています。ほとんどのチームが1時間以内に始められます。',
  },
  {
    question: 'AIコストはどうなりますか？',
    answer: 'AIコストは使用量に応じた従量課金制です。コース生成とチューター連携はAI APIを使用します。一般的な小規模組織の場合、月額$10〜50程度のAI使用量です。使用するプロバイダーを制御でき、コストを最適化できます。',
  },
  {
    question: '他のLMSから移行できますか？',
    answer: 'はい！知恵塾はSCORM 1.2インポートに対応しているため、既存のコースを移行できます。主要なLMSプラットフォーム向けの移行ツールとドキュメントも提供しています。',
  },
  {
    question: 'クラウドプランの無料トライアルはありますか？',
    answer: 'クラウドプロはローンチ時に14日間の無料トライアルを提供予定です。ウェイティングリストに登録すると、アーリーアクセスと延長トライアル期間を利用できます。',
  },
]

export default function PricingPage() {
  return (
    <div className="pt-20 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-gray-900 dark:to-accent/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
              オープンソース • Apache-2.0
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
              シンプルで透明な{' '}
              <span className="text-primary">料金設定</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              知恵塾を無料でセルフホストするか、私たちにお任せください。隠し料金もサプライズもありません。
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-2xl scale-105 z-10'
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-4 py-1 rounded-full bg-accent text-white text-sm font-semibold">
                        人気No.1
                      </span>
                  </div>
                )}

                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 mb-6">
                  <plan.icon className={`w-6 h-6 ${plan.highlighted ? 'text-white' : 'text-primary'}`} />
                </div>

                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>

                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                  {plan.description}
                </p>

                <Button
                  href={plan.ctaLink}
                  variant={plan.highlighted ? 'secondary' : 'primary'}
                  className="w-full mb-8"
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      {feature.included ? (
                        <Check className={`w-5 h-5 mr-2 flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-green-500'}`} />
                      ) : (
                        <X className={`w-5 h-5 mr-2 flex-shrink-0 ${plan.highlighted ? 'text-white/40' : 'text-gray-300 dark:text-gray-600'}`} />
                      )}
                      <span className={`text-sm ${feature.included ? (plan.highlighted ? 'text-white' : 'text-gray-700 dark:text-gray-300') : (plan.highlighted ? 'text-white/40' : 'text-gray-400 dark:text-gray-600')}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              よくある質問
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
