import type { FoodItem } from '@/lib/types/food'

const STORAGE_KEY = 'gallsafe-food-search-v1'
const MAX_ENTRIES = 80

interface CacheEntry {
  foods: FoodItem[]
  cachedAt: number
}

type CacheStore = Record<string, CacheEntry>

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function readStore(): CacheStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CacheStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: CacheStore): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota exceeded or private browsing — ignore silently
  }
}

function evictOldest(store: CacheStore): CacheStore {
  const keys = Object.keys(store)
  if (keys.length < MAX_ENTRIES) return store

  const oldestKey = keys.reduce((oldest, key) => {
    const entry = store[key]
    const oldestEntry = store[oldest]
    if (!entry) return oldest
    if (!oldestEntry) return key
    return entry.cachedAt < oldestEntry.cachedAt ? key : oldest
  }, keys[0])

  const next = { ...store }
  delete next[oldestKey]
  return next
}

/** Returns cached foods for a query, or null if not cached. */
export function getCachedFoodSearch(query: string): FoodItem[] | null {
  const key = normalizeQuery(query)
  if (!key) return null
  const entry = readStore()[key]
  if (!entry || !Array.isArray(entry.foods)) return null
  return entry.foods
}

/** Saves search results to localStorage for future lookups. */
export function setCachedFoodSearch(query: string, foods: FoodItem[]): void {
  const key = normalizeQuery(query)
  if (!key) return

  let store = readStore()
  store = evictOldest(store)
  store[key] = { foods, cachedAt: Date.now() }
  writeStore(store)
}
