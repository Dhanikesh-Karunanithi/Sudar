'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronRight, CircleHelp, Sparkles, RefreshCcw, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
  topic: string
}

interface Quiz {
  questions: QuizQuestion[]
}

interface Props {
  quiz: Quiz
  courseId: string
  moduleId: string
  moduleTitle: string
  learnerName?: string
  onComplete: (score: number, wrongTopics: string[]) => void
  onAskByte: (prompt: string) => void
  onSkip: () => void
}

export function QuizCard({ quiz, moduleTitle, learnerName, onComplete, onAskByte, onSkip }: Props) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const questions = quiz.questions
  const q = questions[currentQ]
  const totalQ = questions.length
  const selectedAnswer = answers[currentQ] ?? -1
  const hasAnswered = selectedAnswer !== -1

  function selectAnswer(idx: number) {
    if (submitted) return
    setAnswers((a) => ({ ...a, [currentQ]: idx }))
  }

  function handleNext() {
    if (currentQ < totalQ - 1) {
      setCurrentQ((q) => q + 1)
      setSubmitted(false)
    } else {
      // Show results
      const correct = questions.filter((q, i) => answers[i] === q.correct).length
      const score = Math.round((correct / totalQ) * 100)
      const wrongTopics = questions
        .filter((q, i) => answers[i] !== q.correct)
        .map((q) => q.topic)
      setShowResults(true)
      onComplete(score, wrongTopics)
    }
  }

  function handleSubmit() {
    if (!hasAnswered) return
    setSubmitted(true)
  }

  const isCorrect = submitted && selectedAnswer === q.correct

  // ── Results screen ─────────────────────────────────────────────────
  if (showResults) {
    const correctCount = questions.filter((q, i) => answers[i] === q.correct).length
    const score = Math.round((correctCount / totalQ) * 100)
    const wrongTopics = questions.filter((q, i) => answers[i] !== q.correct).map((q) => q.topic)
    const passed = score >= 70

    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Score header */}
        <div className="text-center space-y-3">
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto',
            passed ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
          )}>
            <span className="text-2xl font-bold" style={{ color: passed ? '#16a34a' : '#ea580c' }}>{score}%</span>
          </div>
          <div>
            <p className="font-semibold text-card-foreground">
              {score === 100 ? '🎉 Perfect score!' : passed ? 'Well done!' : 'Keep going!'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {correctCount} of {totalQ} correct on <span className="font-medium">{moduleTitle}</span>
            </p>
          </div>
        </div>

        {/* Question breakdown */}
        <div className="space-y-2">
          {questions.map((q, i) => {
            const wasCorrect = answers[i] === q.correct
            return (
              <div key={q.id} className={cn(
                'flex items-start gap-3 p-3 rounded-lg',
                wasCorrect ? 'bg-green-50' : 'bg-red-50'
              )}>
                {wasCorrect
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-card-foreground line-clamp-1">{q.question}</p>
                  {!wasCorrect && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Correct: <span className="font-medium text-green-700">{q.options[q.correct]}</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Struggled topics → Ask Sudar */}
        {wrongTopics.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-card-foreground">Sudar can help with these</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wrongTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => onAskByte(`I got this wrong in the quiz. Can you explain "${topic}" more clearly?`)}
                  className="text-xs px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-medium border border-primary/20 transition-colors"
                >
                  {topic} →
                </button>
              ))}
            </div>
            <p className="text-xs text-primary">Click a topic and Sudar will explain it with your learning style in mind.</p>
          </div>
        )}

        {/* Sudar encouragement prompt */}
        <button
          onClick={() => onAskByte(
            score === 100
              ? `I just scored 100% on the ${moduleTitle} quiz! Can you give me a challenge question to go deeper?`
              : `I just completed the ${moduleTitle} quiz and scored ${score}%. Can you give me a brief summary of the key takeaways?`
          )}
          className="w-full flex items-center gap-2 justify-center py-2.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary text-sm font-medium rounded-xl transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {score === 100 ? 'Challenge me further' : 'Get a summary from Sudar'}
        </button>

        <button
          onClick={handleNext}
          className="w-full py-2.5 bg-primary hover:bg-primary text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Continue to next module →
        </button>
      </div>
    )
  }

  // ── Question screen ────────────────────────────────────────────────
  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleHelp className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">Quick check</span>
          <span className="text-xs text-muted-foreground">{moduleTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{currentQ + 1} / {totalQ}</span>
          <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors">Skip quiz</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-1 bg-primary transition-all duration-500"
          style={{ width: `${((currentQ + (submitted ? 1 : 0)) / totalQ) * 100}%` }}
        />
      </div>

      <div className="p-5 space-y-5">
        {/* Question */}
        <p className="text-sm font-semibold text-card-foreground leading-snug">{q.question}</p>

        {/* Options */}
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let style = 'border-border text-card-foreground hover:border-primary/30 hover:bg-primary/10'
            if (selectedAnswer === i && !submitted) style = 'border-primary bg-primary/10 text-primary'
            if (submitted) {
              if (i === q.correct) style = 'border-green-400 bg-green-50 text-green-800'
              else if (i === selectedAnswer) style = 'border-red-300 bg-red-50 text-red-700'
              else style = 'border-border text-muted-foreground opacity-60'
            }
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                disabled={submitted}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-3',
                  style
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0',
                  submitted && i === q.correct ? 'border-green-400 bg-green-400 text-white'
                    : submitted && i === selectedAnswer ? 'border-red-400 bg-red-400 text-white'
                    : selectedAnswer === i ? 'border-primary bg-primary text-white'
                    : 'border-border text-muted-foreground'
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {submitted && i === q.correct && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
                {submitted && i === selectedAnswer && i !== q.correct && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Explanation after submitting */}
        {submitted && (
          <div className={cn(
            'rounded-xl p-4 space-y-2',
            isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          )}>
            <div className="flex items-center gap-2">
              {isCorrect
                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                : <XCircle className="w-4 h-4 text-red-500" />}
              <p className={cn('text-sm font-semibold', isCorrect ? 'text-green-800' : 'text-red-700')}>
                {isCorrect ? (learnerName ? `Nice one, ${learnerName}!` : 'Correct!') : 'Not quite.'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
            {!isCorrect && (
              <button
                onClick={() => onAskByte(`I answered this quiz question incorrectly: "${q.question}". Can you explain the concept of "${q.topic}" more clearly?`)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary font-medium mt-1"
              >
                <Bot className="w-3.5 h-3.5" />Ask Sudar to explain {q.topic}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!hasAnswered}
              className="flex-1 py-2.5 bg-primary hover:bg-primary disabled:bg-muted disabled:text-muted-foreground text-white text-sm font-semibold rounded-xl transition-all"
            >
              Check answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary text-white text-sm font-semibold rounded-xl transition-all"
            >
              {currentQ < totalQ - 1 ? 'Next question' : 'See results'}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {!submitted && (
            <button
              onClick={() => onAskByte(`While looking at a quiz question about "${q.topic}", I'm not sure about: ${q.question}`)}
              title="Ask Sudar before answering"
              className="p-2.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary rounded-xl transition-colors"
            >
              <Bot className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
