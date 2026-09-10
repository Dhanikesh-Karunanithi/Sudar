import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldChainBackgroundFill } from './scheduleBackgroundFillLogic.ts'

test('shouldChainBackgroundFill continues after a partial module fill', () => {
  assert.equal(
    shouldChainBackgroundFill({
      needsContinue: true,
      modulesGenerated: 1,
      retryableLimit: false,
      fillRound: 0,
    }),
    true,
  )
})

test('shouldChainBackgroundFill stops at max rounds or when complete', () => {
  assert.equal(
    shouldChainBackgroundFill({
      needsContinue: true,
      modulesGenerated: 1,
      retryableLimit: false,
      fillRound: 12,
    }),
    false,
  )
  assert.equal(
    shouldChainBackgroundFill({
      needsContinue: false,
      modulesGenerated: 1,
      retryableLimit: false,
      fillRound: 0,
    }),
    false,
  )
})
