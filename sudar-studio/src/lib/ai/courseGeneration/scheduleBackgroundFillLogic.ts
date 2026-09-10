const MAX_FILL_ROUNDS = 12

export function shouldChainBackgroundFill(input: {
  needsContinue: boolean
  modulesGenerated: number
  retryableLimit: boolean
  fillRound: number
}): boolean {
  if (input.fillRound >= MAX_FILL_ROUNDS) return false
  if (!input.needsContinue) return false
  return input.modulesGenerated > 0 || input.retryableLimit
}
