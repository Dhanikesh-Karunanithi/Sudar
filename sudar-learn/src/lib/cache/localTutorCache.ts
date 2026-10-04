/**
 * Local-first Sudar tutor conversation threads (ChatGPT/Claude-style).
 * IndexedDB mirror — one titled thread list per user + scope (journey | floating).
 */

import { z } from 'zod'

const DB_NAME = 'sudar-local-cache'
const DB_VERSION = 2
const CONVERSATION_STORE = 'tutor-conversations'
const THREAD_STORE = 'tutor-threads'
const MEMORY_STORE = 'memory-snapshots'
const CACHE_PREF_KEY = 'sudar.local_cache.enabled'
const ACTIVE_THREAD_KEY_PREFIX = 'sudar.tutor.activeThread.'

const cachedMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const cachedConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scope: z.string(),
  messages: z.array(cachedMessageSchema),
  updatedAt: z.string(),
  lastServerSyncAt: z.string(),
})

const tutorThreadSchema = z.object({
  id: z.string(),
  userId: z.string(),
  scope: z.string(),
  title: z.string(),
  preview: z.string(),
  messageCount: z.number().int().nonnegative(),
  messages: z.array(cachedMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  pinned: z.boolean().optional(),
})

const memorySnapshotSchema = z.object({
  id: z.string(),
  userId: z.string(),
  selfReportedBackground: z.string(),
  learningGoals: z.string(),
  preferredExplanationStyle: z.string(),
  updatedAt: z.string(),
})

export type CachedTutorMessage = z.infer<typeof cachedMessageSchema>
export type TutorThread = z.infer<typeof tutorThreadSchema>
export type MemorySnapshot = z.infer<typeof memorySnapshotSchema>
type CachedConversation = z.infer<typeof cachedConversationSchema>

export const DEFAULT_THREAD_TITLE = 'New chat'

function canUseBrowserApis(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(CONVERSATION_STORE)) {
        db.createObjectStore(CONVERSATION_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(MEMORY_STORE)) {
        db.createObjectStore(MEMORY_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(THREAD_STORE)) {
        db.createObjectStore(THREAD_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readFromStore<T>(storeName: string, key: string, schema: z.ZodSchema<T>): Promise<T | null> {
  if (!canUseBrowserApis()) return null
  const db = await openDatabase()
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).get(key)
    request.onsuccess = () => {
      const parsed = schema.safeParse(request.result)
      resolve(parsed.success ? parsed.data : null)
    }
    request.onerror = () => resolve(null)
  })
}

async function writeToStore(storeName: string, value: Record<string, unknown>): Promise<void> {
  if (!canUseBrowserApis()) return
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  if (!canUseBrowserApis()) return
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function conversationKey(userId: string, scope: string): string {
  return `${userId}:${scope}`
}

function memoryKey(userId: string): string {
  return userId
}

function activeThreadStorageKey(scope: string): string {
  return `${ACTIVE_THREAD_KEY_PREFIX}${scope}`
}

function newThreadId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Title from the learner's first message (Claude/ChatGPT style). */
export function titleFromFirstUserMessage(content: string): string {
  const cleaned = content
    .replace(/\s+/g, ' ')
    .replace(/^["']+|["']+$/g, '')
    .trim()
  if (!cleaned) return DEFAULT_THREAD_TITLE
  if (cleaned.length <= 48) return cleaned
  return `${cleaned.slice(0, 45).trim()}…`
}

function previewFromMessages(messages: CachedTutorMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (!m?.content?.trim()) continue
    const t = m.content.replace(/\s+/g, ' ').trim()
    return t.length > 80 ? `${t.slice(0, 77)}…` : t
  }
  return ''
}

export function isLocalTutorCacheEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(CACHE_PREF_KEY) !== '0'
}

export function setLocalTutorCacheEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CACHE_PREF_KEY, enabled ? '1' : '0')
}

export function getActiveTutorThreadId(scope: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(activeThreadStorageKey(scope))
  } catch {
    return null
  }
}

export function setActiveTutorThreadId(scope: string, threadId: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const key = activeThreadStorageKey(scope)
    if (!threadId) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, threadId)
  } catch {
    // ignore
  }
}

/** @deprecated Prefer thread APIs — kept for Memory export + migration. */
export async function getCachedConversation(userId: string, scope: string): Promise<CachedTutorMessage[] | null> {
  const activeId = getActiveTutorThreadId(scope)
  if (activeId) {
    const thread = await getTutorThread(activeId)
    if (thread && thread.userId === userId && thread.scope === scope) {
      return thread.messages
    }
  }
  const listed = await listTutorThreads(userId, scope)
  if (listed[0]) return (await getTutorThread(listed[0].id))?.messages ?? null
  const row = await readFromStore(CONVERSATION_STORE, conversationKey(userId, scope), cachedConversationSchema)
  return row?.messages ?? null
}

/** @deprecated Prefer saveTutorThreadMessages. */
export async function putCachedConversation(
  userId: string,
  scope: string,
  messages: CachedTutorMessage[],
): Promise<void> {
  if (!isLocalTutorCacheEnabled()) return
  const thread = await ensureActiveTutorThread(userId, scope)
  await saveTutorThreadMessages(thread.id, messages)
  // Keep legacy row in sync for older readers
  const now = new Date().toISOString()
  const row: CachedConversation = {
    id: conversationKey(userId, scope),
    userId,
    scope,
    messages,
    updatedAt: now,
    lastServerSyncAt: now,
  }
  await writeToStore(CONVERSATION_STORE, row)
}

export async function listTutorThreads(userId: string, scope: string): Promise<TutorThread[]> {
  if (!canUseBrowserApis() || !isLocalTutorCacheEnabled()) return []
  const db = await openDatabase()
  return new Promise((resolve) => {
    if (!db.objectStoreNames.contains(THREAD_STORE)) {
      resolve([])
      return
    }
    const tx = db.transaction(THREAD_STORE, 'readonly')
    const store = tx.objectStore(THREAD_STORE)
    const request = store.getAll()
    request.onsuccess = () => {
      const rows = (request.result as unknown[])
        .map((r) => tutorThreadSchema.safeParse(r))
        .filter((r) => r.success)
        .map((r) => r.data)
        .filter((t) => t.userId === userId && t.scope === scope)
      rows.sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1
        return b.updatedAt.localeCompare(a.updatedAt)
      })
      resolve(rows)
    }
    request.onerror = () => resolve([])
  })
}

export async function getTutorThread(threadId: string): Promise<TutorThread | null> {
  return readFromStore(THREAD_STORE, threadId, tutorThreadSchema)
}

export async function createTutorThread(
  userId: string,
  scope: string,
  title: string = DEFAULT_THREAD_TITLE,
): Promise<TutorThread> {
  const now = new Date().toISOString()
  const thread: TutorThread = {
    id: newThreadId(),
    userId,
    scope,
    title: title.trim() || DEFAULT_THREAD_TITLE,
    preview: '',
    messageCount: 0,
    messages: [],
    createdAt: now,
    updatedAt: now,
    pinned: false,
  }
  if (isLocalTutorCacheEnabled()) {
    await writeToStore(THREAD_STORE, thread)
  }
  setActiveTutorThreadId(scope, thread.id)
  return thread
}

export async function saveTutorThreadMessages(
  threadId: string,
  messages: CachedTutorMessage[],
  opts?: { titleIfUntitled?: string },
): Promise<TutorThread | null> {
  const existing = await getTutorThread(threadId)
  if (!existing) return null
  if (!isLocalTutorCacheEnabled()) {
    return { ...existing, messages, messageCount: messages.length }
  }
  const now = new Date().toISOString()
  let title = existing.title
  if (
    (title === DEFAULT_THREAD_TITLE || !title.trim()) &&
    opts?.titleIfUntitled?.trim()
  ) {
    title = titleFromFirstUserMessage(opts.titleIfUntitled)
  } else if (title === DEFAULT_THREAD_TITLE) {
    const firstUser = messages.find((m) => m.role === 'user' && m.content.trim())
    if (firstUser) title = titleFromFirstUserMessage(firstUser.content)
  }
  const next: TutorThread = {
    ...existing,
    title,
    messages,
    messageCount: messages.length,
    preview: previewFromMessages(messages),
    updatedAt: now,
  }
  await writeToStore(THREAD_STORE, next)
  return next
}

export async function renameTutorThread(threadId: string, title: string): Promise<TutorThread | null> {
  const existing = await getTutorThread(threadId)
  if (!existing) return null
  const next: TutorThread = {
    ...existing,
    title: title.trim().slice(0, 120) || DEFAULT_THREAD_TITLE,
    updatedAt: new Date().toISOString(),
  }
  await writeToStore(THREAD_STORE, next)
  return next
}

export async function deleteTutorThread(threadId: string): Promise<void> {
  await deleteFromStore(THREAD_STORE, threadId)
}

export async function setTutorThreadPinned(threadId: string, pinned: boolean): Promise<TutorThread | null> {
  const existing = await getTutorThread(threadId)
  if (!existing) return null
  const next: TutorThread = {
    ...existing,
    pinned,
    updatedAt: new Date().toISOString(),
  }
  await writeToStore(THREAD_STORE, next)
  return next
}

/**
 * Ensure an active thread exists for this scope.
 * Migrates legacy single-conversation cache into a titled thread once.
 */
export async function ensureActiveTutorThread(userId: string, scope: string): Promise<TutorThread> {
  const activeId = getActiveTutorThreadId(scope)
  if (activeId) {
    const t = await getTutorThread(activeId)
    if (t && t.userId === userId && t.scope === scope) return t
  }

  const listed = await listTutorThreads(userId, scope)
  if (listed[0]) {
    setActiveTutorThreadId(scope, listed[0].id)
    return listed[0]
  }

  const legacy = await readFromStore(
    CONVERSATION_STORE,
    conversationKey(userId, scope),
    cachedConversationSchema,
  )
  if (legacy?.messages?.length) {
    const firstUser = legacy.messages.find((m) => m.role === 'user')
    const thread = await createTutorThread(
      userId,
      scope,
      firstUser ? titleFromFirstUserMessage(firstUser.content) : 'Previous chat',
    )
    const saved = await saveTutorThreadMessages(thread.id, legacy.messages)
    return saved ?? thread
  }

  return createTutorThread(userId, scope)
}

export async function getMemorySnapshot(userId: string): Promise<MemorySnapshot | null> {
  return readFromStore(MEMORY_STORE, memoryKey(userId), memorySnapshotSchema)
}

export async function putMemorySnapshot(snapshot: Omit<MemorySnapshot, 'updatedAt' | 'id'>): Promise<void> {
  if (!isLocalTutorCacheEnabled()) return
  const row: MemorySnapshot = {
    ...snapshot,
    id: memoryKey(snapshot.userId),
    updatedAt: new Date().toISOString(),
  }
  await writeToStore(MEMORY_STORE, row)
}

export async function clearUserLocalTutorCache(userId: string, scope: string): Promise<void> {
  const threads = await listTutorThreads(userId, scope)
  await Promise.all([
    ...threads.map((t) => deleteFromStore(THREAD_STORE, t.id)),
    deleteFromStore(CONVERSATION_STORE, conversationKey(userId, scope)),
    deleteFromStore(MEMORY_STORE, memoryKey(userId)),
  ])
  setActiveTutorThreadId(scope, null)
}

/** Date group label for history UI (Today / Yesterday / Previous 7 days / Older). */
export function threadDateGroupLabel(iso: string, now = new Date()): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Older'
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'Previous 7 days'
  if (diffDays < 30) return 'Previous 30 days'
  return 'Older'
}
