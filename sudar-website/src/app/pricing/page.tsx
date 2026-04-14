import { Metadata } from 'next'
import Link from 'next/link'
import { Check, X, Sparkles, Zap, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Pricing',
  description: '知恵塾 is open source and free to self-host. Choose the option that works best for your organization.',
}

const plans = [
  {
    name: 'Self-Host',
    price: '$0',
    period: 'forever',
    description: 'Perfect for teams who want full control',
    icon: Zap,
    features: [
      { name: 'Full 知恵塾 Studio access', included: true },
      { name: 'Full 知恵塾 Learn access', included: true },
      { name: '知恵塾 Intelligence engine', included: true },
      { name: 'All 7 learning modalities', included: true },
      { name: 'SCORM export/import', included: true },
      { name: 'AI tutor with memory', included: true },
      { name: 'Unlimited courses', included: true },
      { name: 'Community support', included: true },
      { name: 'Priority support', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'SLA guarantee', included: false },
    ],
    cta: 'Get Started',
    ctaLink: 'https://learn.rhgj.jp',
    highlighted: false,
  },
  {
    name: 'Cloud Pro',
    price: '$49',
    period: '/month',
    description: 'Managed hosting with priority support',
    icon: Sparkles,
    features: [
      { name: 'Everything in Self-Host', included: true },
      { name: 'Managed cloud hosting', included: true },
      { name: 'Automatic updates', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom domain', included: true },
      { name: 'API access', included: true },
      { name: 'Up to 500 learners', included: true },
      { name: 'SSO/SAML', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'SLA guarantee', included: false },
    ],
    cta: 'Coming Soon',
    ctaLink: '#',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with specific needs',
    icon: Building2,
    features: [
      { name: 'Everything in Cloud Pro', included: true },
      { name: 'Unlimited learners', included: true },
      { name: 'SSO/SAML integration', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'SLA guarantee (99.9%)', included: true },
      { name: 'On-premise deployment', included: true },
      { name: 'Custom training', included: true },
      { name: 'White-label option', included: true },
      { name: 'Priority feature requests', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    highlighted: false,
  },
]

const faqs = [
  {
    question: 'Is 知恵塾 really free?',
    answer: 'Yes! 知恵塾 is open source under the Apache-2.0 license. You can self-host at $0 cost. You only pay for your own infrastructure (Vercel, Railway/Render free tiers work great) and AI API usage (Together AI, OpenAI, etc.).',
  },
  {
    question: 'What\'s the catch with self-hosting?',
    answer: 'There\'s no catch. You get the full feature set - no limits on courses, learners, or functionality. The trade-off is that you\'re responsible for deployment, maintenance, and scaling. We provide comprehensive documentation to help you.',
  },
  {
    question: 'Do I need to be technical to self-host?',
    answer: 'Basic technical knowledge helps, but we\'ve made it as simple as possible. Our Docker deployment works with a single command, and Vercel/Railway deployments are well-documented. Most teams can get started in under an hour.',
  },
  {
    question: 'What about AI costs?',
    answer: 'AI costs are pay-as-you-go based on your usage. Course generation and tutor interactions use AI APIs. A typical small organization might spend $10-50/month on AI usage. You control which providers to use and can optimize costs.',
  },
  {
    question: 'Can I migrate from another LMS?',
    answer: 'Yes! 知恵塾 supports SCORM 1.2 import, so you can bring existing courses. We also provide migration tools and documentation for common LMS platforms.',
  },
  {
    question: 'Is there a free trial for Cloud plans?',
    answer: 'Cloud Pro will offer a 14-day free trial when it launches. Join our waitlist to get early access and extended trial period.',
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
              Open Source • Apache-2.0
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
              Simple, Transparent{' '}
              <span className="text-primary">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Self-host 知恵塾 for free, or let us manage it for you. No hidden fees, no surprises.
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
                      Most Popular
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
              Frequently Asked Questions
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
