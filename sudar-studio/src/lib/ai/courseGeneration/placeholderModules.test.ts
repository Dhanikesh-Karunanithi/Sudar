import test from 'node:test'
import assert from 'node:assert/strict'
import { placeholderModuleTitles, syntheticCurriculum } from './placeholderModules.ts'

test('placeholderModuleTitles keeps 3 concise lessons', () => {
  const titles = placeholderModuleTitles('Generative AI', 3)
  assert.equal(titles.length, 3)
  assert.equal(titles[0], 'Foundations of Generative AI')
  assert.equal(titles[1], 'Apply Generative AI in your workflow')
  assert.equal(titles[2], 'Practice, pitfalls, and next steps')
  assert.equal(titles.some((t) => /application \d/i.test(t)), false)
})

test('syntheticCurriculum matches module count and required fields', () => {
  const titles = placeholderModuleTitles('Prompting', 3)
  const plan = syntheticCurriculum(titles)
  assert.equal(plan.length, 3)
  assert.equal(plan[0]?.title, titles[0])
  assert.equal(plan[0]?.buildOn, 'None — this is the foundation')
  assert.ok((plan[1]?.sectionStructure.length ?? 0) >= 3)
})
