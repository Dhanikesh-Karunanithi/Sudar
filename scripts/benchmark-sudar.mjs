#!/usr/bin/env node
/**
 * Sudar benchmark harness (stub).
 *
 * Extend this script to measure end-to-end latency and token usage for:
 * - Learn: POST /api/tutor/query (with session cookie or test token — use a dedicated test env)
 * - Intelligence: POST /api/tutor/query, POST /api/audio/generate
 * - Studio: document-to-course route (with auth)
 *
 * For now it prints the contract and env vars to set. See docs/research/EVALUATION_APPENDIX.md.
 */
console.log('Sudar benchmark harness (stub)')
console.log('')
console.log('Set these in a throwaway environment before adding fetch() calls:')
console.log('  SUDAR_INTELLIGENCE_URL or BYTEOS_INTELLIGENCE_URL — Intelligence base URL')
console.log('  LEARN_BASE_URL — e.g. http://localhost:3001')
console.log('  STUDIO_BASE_URL — e.g. http://localhost:3000')
console.log('  INTELLIGENCE_SERVICE_SECRET — only for controlled server-to-server tests')
console.log('')
console.log('Safety: never commit tokens or production URLs into this script output.')
