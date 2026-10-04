export {
  loadDomainGraph,
  prerequisiteClosure,
  claimsForModule,
  findDomainForCourse,
} from '@/lib/teaching/claimGraph'
export {
  applyEvidenceToMastery,
  recordClaimEvidence,
  loadMasteryForUser,
  upsertMastery,
  isDue,
  isWeak,
  MASTERED_THRESHOLD,
  WEAK_THRESHOLD,
} from '@/lib/teaching/mastery'
export {
  buildClaimSchedulerCandidates,
  pickNextFifteenMinutes,
} from '@/lib/teaching/scheduler'
export {
  createLearningSession,
  getLearningSession,
  updateLearningSessionState,
  appendSessionArtifact,
  resumeLatestSession,
} from '@/lib/teaching/session'
export {
  recommendPedagogyMode,
  runPedagogyEngine,
  buildPedagogyPromptBlock,
} from '@/lib/teaching/pedagogyEngine'
export { seedDomainFromCourse } from '@/lib/teaching/seedDomainFromCourse'
export {
  suggestStuckProtocol,
  buildStudyPlan,
  misconceptionConfrontation,
  transferCheckPrompt,
  teachBackPrompt,
  buildOfflineReviewPack,
  buildClaimCredentialBundle,
} from '@/lib/teaching/depth'
