'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, ChevronRight, CheckCircle2, Loader2, Zap, User, Target, BookOpen, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  firstName: string
  existingMemory: Record<string, unknown>
  moduleTitles: string[]
}

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to most topics — building from scratch' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience — looking to deepen knowledge' },
  { value: 'advanced', label: 'Advanced', desc: 'Strong background — focused on mastery' },
]

const LEARNING_STYLES = [
  { value: 'examples-first', label: 'Examples first', desc: 'Show me how it works, then explain why' },
  { value: 'theory-first', label: 'Theory first', desc: 'Explain the concept, then demonstrate' },
  { value: 'analogies', label: 'Analogies', desc: 'Use real-world comparisons and metaphors' },
  { value: 'step-by-step', label: 'Step-by-step', desc: 'Break everything into small, clear steps' },
]

const LEARNING_FREQUENCIES = [
  { value: 'daily', label: 'Daily', desc: '15–30 mins every day' },
  { value: 'few_week', label: 'A few times a week', desc: '3–4 sessions per week' },
  { value: 'weekly', label: 'Weekly', desc: 'One focused session per week' },
  { value: 'flexible', label: 'Flexible', desc: 'Whenever I have time' },
]

const STEPS = [
  { id: 'welcome', icon: Bot, label: 'Meet Sudar' },
  { id: 'background', icon: User, label: 'Your background' },
  { id: 'goals', icon: Target, label: 'Your goals' },
  { id: 'style', icon: Lightbulb, label: 'How you learn' },
  { id: 'done', icon: CheckCircle2, label: 'Done' },
]

export function OnboardingFlow({ firstName, existingMemory }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form values
  const [background, setBackground] = useState((existingMemory.self_reported_background as string) ?? '')
  const [experienceLevel, setExperienceLevel] = useState((existingMemory.difficulty_comfort as string) ?? '')
  const [goals, setGoals] = useState((existingMemory.learning_goals as string) ?? '')
  const [learningStyle, setLearningStyle] = useState((existingMemory.preferred_explanation_style as string) ?? '')
  const [frequency, setFrequency] = useState((existingMemory.learning_frequency as string) ?? '')

  const totalSteps = STEPS.length - 1 // exclude 'done' from progress

  async function handleFinish() {
    setSaving(true)
    await fetch('/api/tutor/memory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        self_reported_background: background,
        learning_goals: goals,
        preferred_explanation_style: learningStyle,
        learning_frequency: frequency,
        difficulty_comfort: experienceLevel,
        onboarding_complete: 'true',
      }),
    })
    // Trigger NBA computation with the new profile
    await fetch('/api/intelligence/next-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true }),
    })
    setSaving(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 -mt-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        {step > 0 && step < STEPS.length - 1 && (
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{STEPS[step].label}</span>
              <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-xl shadow-md">
              <Bot className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-card-foreground">Hi {firstName}, I&apos;m Sudar</h1>
              <p className="text-muted-foreground leading-relaxed">
                I&apos;m your AI learning companion. Before we begin, I&apos;d love to learn a little about you — your background, goals, and how you learn best.
              </p>
              <p className="text-muted-foreground text-sm">This takes about <span className="font-medium text-card-foreground">3 minutes</span> and helps me personalise every course, quiz, and conversation for you from day one.</p>
            </div>
            <button onClick={() => setStep(1)}
              className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-button transition-all shadow-lg shadow-md flex items-center justify-center gap-2">
              Let&apos;s get started <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => router.push('/')} className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 1: Background */}
        {step === 1 && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">Tell Sudar about yourself</h2>
                <p className="text-muted-foreground text-sm">This helps personalise examples and difficulty.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">What&apos;s your professional background?</label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
                placeholder="e.g. I'm a marketing manager at a retail company with 5 years experience. I'm comfortable with data but new to coding and AI tools."
                className="w-full px-3.5 py-3 border border-border rounded-xl text-sm text-card-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-card-foreground">Your overall experience level</label>
              <div className="space-y-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button key={level.value} onClick={() => setExperienceLevel(level.value)}
                    className={cn('w-full text-left p-3.5 rounded-xl border transition-all',
                      experienceLevel === level.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border'
                    )}>
                    <p className={cn('text-sm font-semibold', experienceLevel === level.value ? 'text-primary' : 'text-card-foreground')}>{level.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 text-muted-foreground hover:text-card-foreground text-sm rounded-xl hover:bg-muted transition-all">Back</button>
              <button onClick={() => setStep(2)} disabled={!background.trim() || !experienceLevel}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/100 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">What are you here to achieve?</h2>
                <p className="text-muted-foreground text-sm">Sudar uses this to point you toward what matters most.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">Your learning goals</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                placeholder="e.g. I want to upskill in data analysis so I can make better decisions at work and eventually move into a more technical role within 12 months."
                className="w-full px-3.5 py-3 border border-border rounded-xl text-sm text-card-foreground placeholder-muted-foreground focus:outline-none focus:border-green-400 resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-card-foreground">How often do you plan to learn?</label>
              <div className="grid grid-cols-2 gap-2">
                {LEARNING_FREQUENCIES.map((f) => (
                  <button key={f.value} onClick={() => setFrequency(f.value)}
                    className={cn('text-left p-3 rounded-xl border transition-all',
                      frequency === f.value ? 'border-green-500 bg-green-50' : 'border-border hover:border-border'
                    )}>
                    <p className={cn('text-sm font-semibold', frequency === f.value ? 'text-green-800' : 'text-card-foreground')}>{f.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 text-muted-foreground hover:text-card-foreground text-sm rounded-xl hover:bg-muted transition-all">Back</button>
              <button onClick={() => setStep(3)} disabled={!goals.trim() || !frequency}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/100 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Learning style */}
        {step === 3 && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">How do you learn best?</h2>
                <p className="text-muted-foreground text-sm">Sudar will adapt every explanation to your style.</p>
              </div>
            </div>

            <div className="space-y-2">
              {LEARNING_STYLES.map((style) => (
                <button key={style.value} onClick={() => setLearningStyle(style.value)}
                  className={cn('w-full text-left p-3.5 rounded-xl border transition-all',
                    learningStyle === style.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border'
                  )}>
                  <p className={cn('text-sm font-semibold', learningStyle === style.value ? 'text-primary' : 'text-card-foreground')}>{style.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{style.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 text-muted-foreground hover:text-card-foreground text-sm rounded-xl hover:bg-muted transition-all">Back</button>
              <button onClick={() => { setStep(4); handleFinish() }} disabled={!learningStyle || saving}
                className="flex-1 py-2.5 bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-sm font-semibold rounded-button transition-all flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <>Complete setup <Zap className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-green-200">
              {saving
                ? <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
                : <CheckCircle2 className="w-10 h-10 text-primary-foreground" />}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-card-foreground">
                {saving ? 'Sudar is learning about you...' : "You're all set!"}
              </h2>
              <p className="text-muted-foreground">
                {saving
                  ? 'Building your personalised learning profile and computing your first recommendation...'
                  : `Sudar now knows your background, goals, and learning style. Every course, quiz, and conversation will be tailored to you, ${firstName}.`}
              </p>
            </div>
            {!saving && (
              <div className="space-y-3">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />Check your dashboard — Sudar has already picked your first course.
                  </p>
                </div>
                <button onClick={() => router.push('/')}
                  className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-button transition-all flex items-center justify-center gap-2">
                  Go to my dashboard <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
