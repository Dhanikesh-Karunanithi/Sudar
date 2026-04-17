import { z } from 'zod'

const DB_NAME = 'sudar-local-cache'
const DB_VERSION = 1
const CONVERSATION_STORE = 'tutor-conversations'
const MEMORY_STORE = 'memory-snapshots'
const CACHE_PREF_KEY = 'sudar.local_cache.enabled'
// Cache-aside contract:
// 1) Supabase/API responses remain canonical.
// 2) IndexedDB is a local mirror used for fast rehydration.
// 3) On each successful server write, we overwrite the local row with the latest message list.
// This gives deterministic "server wins" behavior and avoids client-side conflict resolution.

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

const memorySnapshotSchema = z.object({
  id: z.string(),
  userId: z.string(),
  selfReportedBackground: z.string(),
  learningGoals: z.string(),
  preferredExplanationStyle: z.string(),
  updatedAt: z.string(),
})

export type CachedTutorMessage = z.infer<typeof cachedMessageSchema>
export type MemorySnapshot = z.infer<typeof memorySnapshotSchema>
type CachedConversation = z.infer<typeof cachedConversationSchema>

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

export function isLocalTutorCacheEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(CACHE_PREF_KEY) !== '0'
}

export function setLocalTutorCacheEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CACHE_PREF_KEY, enabled ? '1' : '0')
}

export async function getCachedConversation(userId: string, scope: string): Promise<CachedTutorMessage[] | null> {
  const row = await readFromStore(CONVERSATION_STORE, conversationKey(userId, scope), cachedConversationSchema)
  return row?.messages ?? null
}

export async function putCachedConversation(
  userId: string,
  scope: string,
  messages: CachedTutorMessage[],
): Promise<void> {
  if (!isLocalTutorCacheEnabled()) return
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
  await Promise.all([
    deleteFromStore(CONVERSATION_STORE, conversationKey(userId, scope)),
    deleteFromStore(MEMORY_STORE, memoryKey(userId)),
  ])
}
