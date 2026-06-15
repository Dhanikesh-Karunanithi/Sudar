export function buildQuizPrompt(params: {
  content: string
  courseTitle?: string
  moduleTitle?: string
  difficulty: string
  numQuestions: number
  language: string
}): string {
  const { content, courseTitle, moduleTitle, difficulty, numQuestions, language } = params
  return `You are an expert instructional designer creating a quiz for an e-learning module.

Course: "${courseTitle ?? 'Course'}"
Module: "${moduleTitle ?? 'Module'}"
Difficulty: ${difficulty}
Language/locale for all text: ${language}
Module content:
---
${content.slice(0, 2500)}
---

Create exactly ${numQuestions} multiple-choice questions that test genuine comprehension (not just recall).

Rules:
- Each question must be answerable from the module content
- Options must be plausible (no obviously wrong answers)
- Include a 1-sentence explanation for the correct answer
- Tag each question with a short topic name (2-4 words)
- Vary question types: understanding, application, comparison

Return ONLY valid JSON in this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation of why this is correct.",
      "topic": "short topic tag"
    }
  ]
}`
}

export function buildFlashcardsPrompt(params: {
  content: string
  moduleTitle?: string
  language: string
}): string {
  const { content, moduleTitle, language } = params
  return `You are a learning designer. From the following module content, extract 4–8 flashcard pairs for study. Write in language/locale: ${language}. Each pair: front = question or term (short), back = answer or definition (1–3 sentences). Output ONLY a JSON array of objects with keys "front" and "back". No markdown, no explanation.

Module title: ${moduleTitle ?? 'Module'}

Content:
${content.slice(0, 4000)}

JSON array:`
}

export function buildInteractivePrompt(params: {
  content: string
  title?: string
  componentTypes: string[]
  imageUrl?: string
  language: string
}): string {
  const types = params.componentTypes.join(', ')
  return `You are an instructional designer creating interactive e-learning blocks (Genially-style).

Title: "${params.title ?? 'Activity'}"
Language/locale: ${params.language}
Requested component types: ${types}
${params.imageUrl ? `Image URL for hotspot if needed: ${params.imageUrl}` : ''}

Source content:
---
${params.content.slice(0, 3000)}
---

Generate 1–3 interactive elements matching the requested types. Use this JSON structure only:
{
  "interactive_elements": [
    {
      "type": "timeline",
      "data": { "steps": [{ "title": "Step", "description": "Detail" }] }
    },
    {
      "type": "matching",
      "data": { "instruction": "Match terms", "pairs": [{ "term": "A", "definition": "B" }] }
    },
    {
      "type": "tabs",
      "data": { "tabs": [{ "label": "Tab 1", "content": "Markdown content" }] }
    },
    {
      "type": "flipcard",
      "data": { "cards": [{ "front": "Term", "back": "Definition" }] }
    },
    {
      "type": "hotspot",
      "data": { "imageUrl": "${params.imageUrl ?? 'https://example.com/image.png'}", "spots": [{ "x": 50, "y": 50, "label": "Point" }] }
    },
    {
      "type": "quiz",
      "data": { "question": "Question?", "options": ["A","B","C","D"], "correct": 0 }
    }
  ]
}`
}

export function buildOutlinePrompt(params: {
  courseTitle: string
  description?: string
  difficulty: string
  numModules: number
  language: string
}): string {
  return `Create a course outline for:

Course title: "${params.courseTitle}"
${params.description ? `Description: ${params.description}` : ''}
Difficulty: ${params.difficulty}
Number of modules: ${params.numModules}
Language/locale for module titles: ${params.language}

Return ONLY a JSON array of module title strings. Example:
["Introduction", "Core Concepts", "Practice", "Summary"]

Return only the JSON array:`
}

export function buildDocumentOutlinePrompt(params: {
  text: string
  courseTitle?: string
  difficulty: string
  language: string
}): string {
  return `From the following document excerpt, produce a course outline as a JSON array of module titles (5–8 modules). Language: ${params.language}. Difficulty: ${params.difficulty}.
${params.courseTitle ? `Suggested course title context: ${params.courseTitle}` : ''}

Document:
${params.text.slice(0, 8000)}

Return ONLY a JSON array of strings:`
}
