import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Discover all the powerful features of Sudar - AI-powered course creation, adaptive learning, AI tutor, and more.',
}

export default function FeaturesPage() {
  return (
    <div className="pt-20 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-gray-900 dark:to-accent/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
              Powerful Features for{' '}
              <span className="text-primary">Modern Learning</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Everything you need to create, deliver, and optimize learning experiences. 
              Powered by AI, designed for humans.
            </p>
          </div>
        </div>
      </section>

      {/* Studio Features */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light text-sm font-medium mb-4">
              For Creators
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Sudar Studio
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              Build professional courses in minutes, not weeks. No instructional design expertise required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Course Generation',
                description: 'Upload PDFs, DOCX, URLs, or text prompts. AI generates complete course structure, content, and assessments.',
                features: ['Document upload', 'URL import', 'Text prompt generation', 'Multi-source combination'],
              },
              {
                title: '14 Visual Templates',
                description: 'Professional course designs that work for any subject. Change templates without losing content.',
                features: ['Modern & Minimal', 'Corporate & Academic', 'Dark Mode', 'Mobile-responsive'],
              },
              {
                title: 'Multi-Source Media',
                description: 'Search and integrate images, videos, and GIFs from multiple sources directly into your courses.',
                features: ['Google Images', 'Pexels & Unsplash', 'Giphy', 'Custom uploads'],
              },
              {
                title: 'SCORM Export',
                description: 'Export courses as SCORM 1.2 packages for compatibility with any LMS.',
                features: ['SCORM 1.2 compliant', 'Progress tracking', 'Quiz scoring', 'Offline capable'],
              },
              {
                title: 'Learning Paths',
                description: 'Create ordered sequences of courses with prerequisites and certifications.',
                features: ['Course sequencing', 'Prerequisites', 'Due dates', 'Certificate issuance'],
              },
              {
                title: 'Analytics Dashboard',
                description: 'Track completions, identify skill gaps, and analyze engagement patterns.',
                features: ['Completion rates', 'Drop-off analysis', 'Team progress', 'Skill gap heatmap'],
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
              For Learners
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Sudar Learn
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              Personalized learning experiences that adapt to each individual. Your AI tutor remembers everything.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Tutor "Sudar"',
                description: 'Your personal tutor with longitudinal memory. Answers questions, provides explanations, and remembers your context.',
                features: ['RAG-powered Q&A', 'Longitudinal memory', 'Proactive nudges', 'Multi-language'],
              },
              {
                title: 'Digital Learner Twin',
                description: 'Your learning profile that evolves with you. Tracks preferences, behavior, and learning patterns.',
                features: ['Modality preferences', 'Skill tracking', 'Behavioral signals', 'Next best action'],
              },
              {
                title: 'Seven Modalities',
                description: 'Learn in the format that works best for you. Switch between modalities at any time.',
                features: ['Reading & Video', 'Audio/Podcast', 'MindMap & Flashcards', 'Feed & Games'],
              },
              {
                title: 'Adaptive Learning',
                description: 'AI adjusts difficulty, pace, and content recommendations based on your performance.',
                features: ['Difficulty calibration', 'Pace detection', 'Struggle detection', 'Smart recommendations'],
              },
              {
                title: 'Progress Tracking',
                description: 'Visual progress indicators, learning streaks, and achievement badges to keep you motivated.',
                features: ['Learning streaks', 'Completion certificates', 'Skill proficiency', 'Time tracking'],
              },
              {
                title: 'Mobile-First Design',
                description: 'Learn anywhere, on any device. Responsive design that works beautifully on mobile.',
                features: ['PWA support', 'Touch gestures', 'Offline caching', 'Fast performance'],
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
