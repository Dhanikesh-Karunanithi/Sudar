import type { CurriculumEntry } from './types'

/** Fast MCP kickoff cannot wait on outline AI (ChatGPT aborts ~10s). */
export function placeholderModuleTitles(courseTitle: string, count: number): string[] {
  const n = Math.min(12, Math.max(2, Math.round(count)))
  const topic = courseTitle.trim() || 'this topic'
  if (n === 2) {
    return [`What is ${topic}?`, `Apply ${topic} in your workflow`]
  }
  const titles = [`Foundations of ${topic}`]
  const middles = [
    `Apply ${topic} in your workflow`,
    `Quality, risks, and responsible use`,
    `Worked examples for practitioners`,
  ]
  for (let i = 1; i < n - 1; i += 1) {
    titles.push(middles[(i - 1) % middles.length] ?? `Practice ${topic}`)
  }
  titles.push('Practice, pitfalls, and next steps')
  return titles
}

const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const
const ARCHETYPES = ['cold-open', 'socratic', 'case-file', 'misconception-trap', 'comparison-engine'] as const

/** Skip a curriculum-plan AI call on concise Worker fills (subrequest budget). */
export function syntheticCurriculum(titles: string[]): CurriculumEntry[] {
  return titles.map((title, i) => {
    const isFirst = i === 0
    const isLast = i === titles.length - 1
    return {
      title,
      bloomLevel: BLOOMS[Math.min(i, BLOOMS.length - 1)] ?? 'Understand',
      pedagogicalRole: isFirst
        ? 'Foundation / orientation'
        : isLast
          ? 'Synthesis / capstone'
          : 'Practical application',
      sectionStructure: isFirst
        ? ['Why this matters', 'Core idea', 'What good looks like']
        : isLast
          ? ['Recap', 'Practice', 'Watch-outs', 'Next steps']
          : ['The idea', 'Worked example', 'Your turn', 'Common mistakes'],
      brief: `Teach "${title}" in the context of this course.`,
      buildOn: isFirst ? 'None — this is the foundation' : `Builds on "${titles[i - 1]}"`,
      archetype: ARCHETYPES[i % ARCHETYPES.length],
    }
  })
}
