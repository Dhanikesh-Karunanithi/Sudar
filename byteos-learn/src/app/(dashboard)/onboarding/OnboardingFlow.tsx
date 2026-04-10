'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, CheckCircle2, Zap, User, Target, BookOpen, Lightbulb, Bot } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { SudarPremiumMark } from '@/components/branding/SudarPremiumLoader'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import type { MascotId, MascotIntensity, MascotMode, MascotSupportStyle } from '@/types/mascot'

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

const MASCOT_MODES: { value: MascotMode; label: string; desc: string }[] = [
  { value: 'all', label: 'Sudar + companions', desc: 'Use full support from Sudar, Focus, Memory, and Confidence' },
  { value: 'selected', label: 'Selected companions', desc: 'Use Sudar and only the companions you choose' },
  { value: 'hero-only', label: 'Sudar only', desc: 'Keep only Sudar as your always-on guide' },
]

const MASCOT_STYLES: { value: MascotSupportStyle; label: string; desc: string }[] = [
  { value: 'calm', label: 'Calm', desc: 'Steady and reassuring guidance' },
  { value: 'balanced', label: 'Balanced', desc: 'Friendly and practical guidance' },
  { value: 'energetic', label: 'Energetic', desc: 'High-momentum and motivating guidance' },
]

const MASCOT_INTENSITIES: { value: MascotIntensity; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Fewer interruptions' },
  { value: 'medium', label: 'Medium', desc: 'Support at key moments' },
  { value: 'high', label: 'High', desc: 'Frequent support and reactions' },
]

const STEPS = [
  { id: 'welcome', icon: Bot, label: 'Meet Sudar' },
  { id: 'background', icon: User, label: 'Your background' },
  { id: 'goals', icon: Target, label: 'Your goals' },
  { id: 'style', icon: Lightbulb, label: 'How you learn' },
  { id: 'mascot', icon: Bot, label: 'Companions' },
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
  const [mascotMode, setMascotMode] = useState<MascotMode>('all')
  const [mascotStyle, setMascotStyle] = useState<MascotSupportStyle>('balanced')
  const [mascotIntensity, setMascotIntensity] = useState<MascotIntensity>('high')
  const [mascotCompanions, setMascotCompanions] = useState<MascotId[]>(['focus', 'memory', 'confidence'])

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
    await fetch('/api/learner/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mascot_mode: mascotMode,
        mascot_style: mascotStyle,
        mascot_intensity: mascotIntensity,
        mascot_companions: mascotCompanions,
      }),
    })
    void trackMascotEvent({
      eventType: 'mascot_mode_change',
      mascotId: 'sudar',
      source: 'onboarding',
      detail: {
        mascot_mode: mascotMode,
        mascot_style: mascotStyle,
        mascot_intensity: mascotIntensity,
        mascot_companions: mascotCompanions,
      },
    })
    setSaving(false)
    router.push('/')
  }

  function toggleCompanion(id: MascotId) {
    if (id === 'sudar') return
    setMascotCompanions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
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
            <div className="mx-auto flex h-16 w-44 max-w-full items-center justify-center">
              <SudarLogoMark className="h-full w-full text-primary" starFill="var(--background)" animated />
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
              <button onClick={() => setStep(4)} disabled={!learningStyle || saving}
                className="flex-1 py-2.5 bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-sm font-semibold rounded-button transition-all flex items-center justify-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Mascot preferences */}
        {step === 4 && (
          <div className="bg-card border border-border rounded-2xl p-7 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-card-foreground">How should Sudar support you?</h2>
                <p className="text-muted-foreground text-sm">You can always change this in settings.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-card-foreground">Companion visibility</label>
              <div className="space-y-2">
                {MASCOT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setMascotMode(mode.value)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-xl border transition-all',
                      mascotMode === mode.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border',
                    )}
                  >
                    <p className={cn('text-sm font-semibold', mascotMode === mode.value ? 'text-primary' : 'text-card-foreground')}>{mode.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Support style</label>
                {MASCOT_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setMascotStyle(style.value)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      mascotStyle === style.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border',
                    )}
                  >
                    <p className={cn('text-sm font-semibold', mascotStyle === style.value ? 'text-primary' : 'text-card-foreground')}>{style.label}</p>
                    <p className="text-xs text-muted-foreground">{style.desc}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Interaction intensity</label>
                {MASCOT_INTENSITIES.map((intensity) => (
                  <button
                    key={intensity.value}
                    onClick={() => setMascotIntensity(intensity.value)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      mascotIntensity === intensity.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border',
                    )}
                  >
                    <p className={cn('text-sm font-semibold', mascotIntensity === intensity.value ? 'text-primary' : 'text-card-foreground')}>{intensity.label}</p>
                    <p className="text-xs text-muted-foreground">{intensity.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {mascotMode !== 'hero-only' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">Choose companions</label>
                <div className="flex flex-wrap gap-2">
                  {(['focus', 'memory', 'confidence'] as MascotId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleCompanion(id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors',
                        mascotCompanions.includes(id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-card-foreground',
                      )}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="px-4 py-2.5 text-muted-foreground hover:text-card-foreground text-sm rounded-xl hover:bg-muted transition-all">Back</button>
              <button onClick={() => { setStep(5); handleFinish() }} disabled={saving}
                className="flex-1 py-2.5 bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-sm font-semibold rounded-button transition-all flex items-center justify-center gap-2">
                {saving ? <><SudarInlineLoader size="sm" className="text-primary-foreground" starFill="var(--primary)" />Saving...</> : <>Complete setup <Zap className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="text-center space-y-6">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-green-200 overflow-hidden">
              {saving ? (
                <>
                  <div className="absolute inset-0 bg-white/25 backdrop-blur-md" aria-hidden />
                  <div className="relative flex h-[52px] w-[84px] items-center justify-center overflow-hidden">
                    <SudarPremiumMark className="min-h-0 min-w-0 scale-[0.24] [&_.sudar-premium-scene]:max-w-none" />
                  </div>
                </>
              ) : (
                <CheckCircle2 className="w-10 h-10 text-primary-foreground relative z-10" />
              )}
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
