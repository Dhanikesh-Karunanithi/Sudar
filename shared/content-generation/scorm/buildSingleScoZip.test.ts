import { describe, it, expect } from 'vitest'
import { buildQuizScormZip } from './scorm/buildSingleScoZip'
import { parseQuizFromAi } from './parsers'

describe('content-generation SCORM export', () => {
  it('builds a non-empty quiz SCORM zip', () => {
    const quiz = parseQuizFromAi(`{
      "questions": [{
        "id": "q1",
        "question": "What is 2+2?",
        "options": ["3","4","5","6"],
        "correct": 1,
        "explanation": "Basic math.",
        "topic": "math"
      }]
    }`)
    const zip = buildQuizScormZip({
      title: 'Test Quiz',
      questions: quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      })),
    })
    expect(zip.length).toBeGreaterThan(200)
    expect(zip.subarray(0, 2).toString()).toBe('PK')
  })
})
