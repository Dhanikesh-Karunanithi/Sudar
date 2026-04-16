import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '機能',
  description: '知恵塾のすべての強力な機能 - AI搭載コース作成、アダプティブラーニング、AIチューターなど。',
}

export default function FeaturesPage() {
  return (
    <div className="pt-20 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-gray-900 dark:to-accent/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
              モダンな学習のための{' '}
              <span className="text-primary">強力な機能</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              学習体験を作成、配信、最適化するために必要なすべて。AIが駆動し、人間のために設計。
            </p>
          </div>
        </div>
      </section>

      {/* Studio Features */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light text-sm font-medium mb-4">
              クリエイター向け
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              知恵塾 Studio
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              数週間ではなく数分でプロフェッショナルなコースを構築。インストラクショナルデザインの専門知識は不要。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AIコース生成',
                description: 'PDF、DOCX、URL、またはテキストプロンプトをアップロード。AIが完全なコース構造、コンテンツ、評価を生成。',
                features: ['ドキュメントアップロード', 'URLインポート', 'テキストプロンプト生成', 'マルチソース組み合わせ'],
              },
              {
                title: '14のビジュアルテンプレート',
                description: 'あらゆる科目に対応するプロフェッショナルなコースデザイン。コンテンツを失うことなくテンプレート変更。',
                features: ['モダン＆ミニマル', 'コーポレート＆アカデミック', 'ダークモード', 'モバイルレスポンシブ'],
              },
              {
                title: 'マルチソースメディア',
                description: '複数のソースから画像、ビデオ、GIFを検索してコースに直接統合。',
                features: ['Google画像', 'Pexels＆Unsplash', 'Giphy', 'カスタムアップロード'],
              },
              {
                title: 'SCORMエクスポート',
                description: 'あらゆるLMSと互換性のあるSCORM 1.2パッケージとしてコースをエクスポート。',
                features: ['SCORM 1.2準拠', '進捗追跡', 'クイズ採点', 'オフライン対応'],
              },
              {
                title: 'ラーニングパス',
                description: '前提条件と資格認定付きのコース順序シーケンスを作成。',
                features: ['コース順序付け', '前提条件', '期限設定', '修了証発行'],
              },
              {
                title: '分析ダッシュボード',
                description: '完了率を追跡、スキルギャップを特定、エンゲージメントパターンを分析。',
                features: ['完了率', 'ドロップオフ分析', 'チーム進捗', 'スキルギャップヒートマップ'],
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learn Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light text-sm font-medium mb-4">
              学習者向け
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              知恵塾 Learn
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              各個人に適応するパーソナライズされた学習体験。AIチューターがすべてを記憶します。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AIチューター「知恵塾」',
                description: '縦断的記憶を持つパーソナルチューター。質問に答え、説明を提供し、あなたのコンテキストを記憶。',
                features: ['RAG搭載Q&A', '縦断的記憶', 'プロアクティブなナッジ', '多言語対応'],
              },
              {
                title: 'デジタル学習ツイン',
                description: 'あなたと共に進化する学習プロファイル。好み、行動、学習パターンを追跡。',
                features: ['モダリティ設定', 'スキル追跡', '行動シグナル', 'ネクストベストアクション'],
              },
              {
                title: '7つのモダリティ',
                description: 'あなたに最適な形式で学習。いつでもモダリティを切り替え可能。',
                features: ['リーディング＆ビデオ', 'オーディオ/ポッドキャスト', 'マインドマップ＆フラッシュカード', 'フィード＆ゲーム'],
              },
              {
                title: 'アダプティブラーニング',
                description: 'AIがパフォーマンスに基づいて難易度、ペース、コンテンツ推奨を調整。',
                features: ['難易度キャリブレーション', 'ペース検出', 'つまずき検出', 'スマート推奨'],
              },
              {
                title: '進捗追跡',
                description: 'ビジュアル進捗インジケーター、学習ストリーク、達成バッジでモチベーションを維持。',
                features: ['学習ストリーク', '完了証明書', 'スキル習熟度', '時間追跡'],
              },
              {
                title: 'モバイルファーストデザイン',
                description: 'どこでも、どんなデバイスでも学習。モバイルで美しく動作するレスポンシブデザイン。',
                features: ['PWAサポート', 'タッチジェスチャー', 'オフラインキャッシュ', '高速パフォーマンス'],
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
