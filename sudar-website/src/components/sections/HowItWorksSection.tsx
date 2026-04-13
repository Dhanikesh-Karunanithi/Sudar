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
    title: 'Create in Minutes',
    description: 'Upload a PDF or paste a URL. AI generates the course structure, content, and quizzes. No instructional designer required.',
    color: 'from-orange-500 to-red-500',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'Customize & Brand',
    description: 'Choose from 14 visual templates. Edit content, add media, and match your organization\'s branding. Preview in real-time.',
    color: 'from-primary to-purple-500',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Publish & Enroll',
    description: 'One-click publish to Sudar Learn. Assign to teams, set due dates, and track progress automatically.',
    color: 'from-accent to-blue-500',
  },
  {
    number: '04',
    icon: Brain,
    title: 'AI Adapts Learning',
    description: 'The Digital Learner Twin observes behavior. Sudar adapts modality, pace, and difficulty for each individual.',
    color: 'from-pink-500 to-rose-500',
  },
]

const benefits = [
  '15 minutes vs 15 weeks compared to traditional authoring tools',
  'Zero instructional design expertise required',
  'Personalized learning for every student',
  'Real-time analytics and skill gap detection',
  'Open source and self-host at $0',
  'SCORM compatible with existing LMS',
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
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            From document to deployed course in four simple steps. Sudar handles the complexity so you can focus on outcomes.
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
              Why Organizations Choose Sudar
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
