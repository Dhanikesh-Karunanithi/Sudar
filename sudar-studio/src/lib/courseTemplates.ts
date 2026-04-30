import type { ModuleContent, RichContent } from '@/types/content'

export interface CourseTemplateDefinition {
  id: string
  label: string
  description: string
  moduleTitle: string
  content: ModuleContent
}

function richBase(): RichContent {
  return {
    type: 'rich',
    introduction: '',
    sections: [],
    summary: '',
    interactiveElements: [],
  }
}

export const COURSE_TEMPLATES: CourseTemplateDefinition[] = [
  {
    id: 'blank_text',
    label: 'Blank lesson',
    description: 'Start from an empty text lesson and write everything manually.',
    moduleTitle: 'Module 1: Getting started',
    content: { type: 'text', body: '## Module overview\n\nStart writing your lesson here.' },
  },
  {
    id: 'structured_lesson',
    label: 'Structured lesson',
    description: 'Introduction, three teaching sections, and summary.',
    moduleTitle: 'Module 1: Core concepts',
    content: {
      ...richBase(),
      introduction: 'Introduce the topic and explain why it matters for the learner.',
      sections: [
        { heading: 'Concept 1', content: 'Explain the first concept with a practical example.' },
        { heading: 'Concept 2', content: 'Break down the second concept in simple steps.' },
        { heading: 'Concept 3', content: 'Connect this concept to the learner’s day-to-day work.' },
      ],
      summary: 'Summarize the key takeaways and what learners should do next.',
    },
  },
  {
    id: 'interactive_lesson',
    label: 'Interactive lesson',
    description: 'Narrative lesson with embedded quiz and tabs blocks.',
    moduleTitle: 'Module 1: Practice and apply',
    content: {
      ...richBase(),
      introduction: 'Set context with a scenario learners can relate to.',
      sections: [
        { heading: 'Scenario', content: 'Describe a realistic situation the learner will analyze.' },
        { heading: 'Guided walkthrough', content: 'Provide a step-by-step method to solve it.' },
      ],
      summary: 'Reinforce the decision process and confidence checks.',
      interactiveElements: [
        {
          type: 'tabs',
          data: {
            tabs: [
              { id: 'tab-1', label: 'Do', content: 'What to do in this situation.' },
              { id: 'tab-2', label: 'Do not', content: 'Common mistakes to avoid.' },
            ],
          },
        },
        {
          type: 'quiz',
          data: {
            question: 'Which option is the best next step?',
            options: ['Option A', 'Option B', 'Option C'],
            correctAnswer: 'Option B',
            explanation: 'Option B follows the recommended process.',
          },
        },
      ],
    },
  },
  {
    id: 'compliance_sop',
    label: 'Compliance / SOP',
    description: 'Policy intent, checklist, and decision scenario.',
    moduleTitle: 'Module 1: Policy essentials',
    content: {
      ...richBase(),
      introduction: 'State the policy objective and who is accountable.',
      sections: [
        { heading: 'Policy summary', content: 'Outline the policy in plain language.' },
        { heading: 'Required checklist', content: '- Step 1\n- Step 2\n- Step 3' },
        { heading: 'Escalation path', content: 'Explain who to contact and when to escalate.' },
      ],
      summary: 'List the minimum standards that must be met every time.',
      interactiveElements: [
        {
          type: 'matching',
          data: {
            instruction: 'Match each risk type with the right action.',
            pairs: [
              { id: 'pair-1', term: 'High risk', definition: 'Escalate immediately' },
              { id: 'pair-2', term: 'Medium risk', definition: 'Document and review' },
            ],
          },
        },
      ],
    },
  },
]

export function getCourseTemplate(templateId?: string | null): CourseTemplateDefinition {
  if (!templateId) return COURSE_TEMPLATES[1]
  return COURSE_TEMPLATES.find((t) => t.id === templateId) ?? COURSE_TEMPLATES[1]
}
