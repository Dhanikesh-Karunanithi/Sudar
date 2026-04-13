import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Terminal, Cloud, Server, Database, Key, Zap, 
  CheckCircle, ArrowRight, ExternalLink, Copy, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Get Started',
  description: 'Start using Sudar in minutes. Self-host at $0 with our quick start guide.',
}

const steps = [
  {
    number: '01',
    title: 'Prerequisites',
    icon: Server,
    items: [
      'Node.js 18+ installed',
      'A Supabase account (free tier works)',
      'AI API key (Together AI, OpenAI, or Anthropic)',
      'Git installed on your machine',
    ],
  },
  {
    number: '02',
    title: 'Clone the Repository',
    icon: Terminal,
    code: 'git clone https://github.com/Dhanikesh-Karunanithi/Sudar.git\ncd Sudar',
  },
  {
    number: '03',
    title: 'Set Up Environment',
    icon: Database,
    items: [
      'Create a Supabase project',
      'Run database migrations',
      'Copy .env.example to .env',
      'Fill in your credentials',
    ],
  },
  {
    number: '04',
    title: 'Deploy',
    icon: Cloud,
    items: [
      'Deploy Studio to Vercel',
      'Deploy Learn to Vercel',
      'Deploy Intelligence to Railway',
      'Connect your services',
    ],
  },
]

const deploymentOptions = [
  {
    title: 'Docker Compose',
    description: 'One-command deployment for self-hosted instances.',
    icon: Server,
    link: '/docs/docker',
    recommended: false,
  },
  {
    title: 'Vercel + Railway',
    description: 'Recommended for most users. Free tier available.',
    icon: Cloud,
    link: '/docs/vercel',
    recommended: true,
  },
  {
    title: 'Kubernetes',
    description: 'For enterprise-scale deployments.',
    icon: Database,
    link: '/docs/kubernetes',
    recommended: false,
  },
]

export default function GetStartedPage() {
  return (
    <div className="pt-20 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 dark:from-primary/10 dark:via-gray-900 dark:to-accent/10 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-1" />
              Quick Start Guide
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
              Get Started in{' '}
              <span className="text-primary">Minutes</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Self-host Sudar at $0. Follow our step-by-step guide to deploy your own 
              AI-native learning platform.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Steps */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      Step {step.number}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                  </div>
                  
                  {step.items && (
                    <ul className="space-y-2">
                      {step.items.map((item, i) => (
                        <li key={i} className="flex items-center text-gray-600 dark:text-gray-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {step.code && (
                    <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 mt-3">
                      <pre className="text-sm text-gray-100 overflow-x-auto">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Choose Your Deployment
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Multiple options to fit your infrastructure needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {deploymentOptions.map((option, index) => (
              <div
                key={index}
                className={`relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg ${
                  option.recommended ? 'ring-2 ring-primary' : ''
                }`}
              >
                {option.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                      Recommended
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mb-6">
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {option.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {option.description}
                </p>
                
                <Button href={option.link} variant="outline" className="w-full">
                  View Guide
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Environment Variables */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Environment Variables
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Required configuration for your deployment.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
            <div className="space-y-6">
              {[
                {
                  name: 'NEXT_PUBLIC_SUPABASE_URL',
                  description: 'Your Supabase project URL',
                  required: true,
                },
                {
                  name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
                  description: 'Supabase anonymous key',
                  required: true,
                },
                {
                  name: 'SUPABASE_SERVICE_ROLE_KEY',
                  description: 'Supabase service role key (server-side only)',
                  required: true,
                },
                {
                  name: 'TOGETHER_API_KEY',
                  description: 'Together AI API key (or OPENAI_API_KEY)',
                  required: true,
                },
                {
                  name: 'NEXTAUTH_SECRET',
                  description: 'Random string for session encryption',
                  required: true,
                },
                {
                  name: 'BYTEOS_INTELLIGENCE_URL',
                  description: 'URL of your Intelligence deployment',
                  required: true,
                },
              ].map((env, index) => (
                <div key={index} className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-1">
                      <code className="text-sm font-mono text-primary dark:text-primary-light bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded">
                        {env.name}
                      </code>
                      {env.required && (
                        <span className="text-xs text-red-500 font-medium">Required</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {env.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Resources
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Documentation', description: 'Full setup and configuration guides', icon: BookOpen, href: '/docs' },
              { title: 'API Reference', description: 'Complete API documentation', icon: Terminal, href: '/api' },
              { title: 'GitHub Repository', description: 'Source code and issues', icon: Key, href: 'https://github.com/Dhanikesh-Karunanithi/Sudar' },
              { title: 'Community', description: 'Join discussions and get help', icon: Zap, href: '/community' },
            ].map((resource, index) => (
              <Link
                key={index}
                href={resource.href}
                target={resource.href.startsWith('http') ? '_blank' : undefined}
                rel={resource.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <resource.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 font-serif">
            Ready to Start?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of educators using Sudar to deliver personalized learning.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href="https://github.com/Dhanikesh-Karunanithi/Sudar"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <ExternalLink className="mr-2 w-5 h-5" />
              View on GitHub
            </Button>
            <Button
              href="/docs"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-white text-white hover:bg-white/10"
            >
              <BookOpen className="mr-2 w-5 h-5" />
              Read the Docs
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
