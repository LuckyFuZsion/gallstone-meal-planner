import type { SavedMeal } from '@/components/saved-meals'
import type { SelectedFood } from '@/lib/types/food'
import type { PortionPreset } from '@/lib/nutrition'
import type { CookingMethodPreference } from '@/lib/types/recipe'
import { isCookingMethodPreference } from '@/lib/cooking-methods'

const SAVED_MEALS_KEY = 'gallsafe-saved-meals-v1'
const MEAL_DRAFT_KEY = 'gallsafe-meal-draft-v1'
const TRIGGER_FOODS_KEY = 'gallsafe-trigger-foods-v1'
const USER_NAME_KEY = 'gallsafe-user-name-v1'

export interface MealDraft {
  selected: SelectedFood[]
  cookingFat: boolean
  digestiveTriggers: boolean
  cookingMethod: CookingMethodPreference
  portionPreset: PortionPreset
  customPortionPercent: number
}

const DEFAULT_TRIGGER_FOODS = [
  'Fried foods',
  'Full-fat cheese',
  'Cream-based sauces',
  'Processed meats',
]

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or private browsing
  }
}

function isSavedMeal(value: unknown): value is SavedMeal {
  if (!value || typeof value !== 'object') return false
  const m = value as SavedMeal
  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    typeof m.totalFat === 'number' &&
    typeof m.calories === 'number' &&
    typeof m.savedAt === 'string' &&
    Array.isArray(m.ingredients)
  )
}

function isMealDraft(value: unknown): value is MealDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as Record<string, unknown>
  if (
    !Array.isArray(d.selected) ||
    typeof d.cookingFat !== 'boolean' ||
    typeof d.digestiveTriggers !== 'boolean' ||
    typeof d.portionPreset !== 'string' ||
    typeof d.customPortionPercent !== 'number'
  ) {
    return false
  }
  if (
    d.cookingMethod !== undefined &&
    (typeof d.cookingMethod !== 'string' || !isCookingMethodPreference(d.cookingMethod))
  ) {
    return false
  }
  return true
}

export function loadSavedMeals(): SavedMeal[] | null {
  const data = readJson<unknown>(SAVED_MEALS_KEY)
  if (!Array.isArray(data)) return null
  const meals = data.filter(isSavedMeal)
  return meals
}

export function saveSavedMeals(meals: SavedMeal[]): void {
  writeJson(SAVED_MEALS_KEY, meals)
}

export function loadMealDraft(): MealDraft | null {
  const data = readJson<unknown>(MEAL_DRAFT_KEY)
  if (!isMealDraft(data)) return null
  const draft = data as MealDraft & { cookingMethod?: CookingMethodPreference }
  return {
    ...draft,
    cookingMethod: draft.cookingMethod ?? 'auto',
  }
}

export function saveMealDraft(draft: MealDraft): void {
  writeJson(MEAL_DRAFT_KEY, draft)
}

export function clearMealDraft(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(MEAL_DRAFT_KEY)
  } catch {
    // ignore
  }
}

export function loadTriggerFoods(): string[] {
  const data = readJson<unknown>(TRIGGER_FOODS_KEY)
  if (!Array.isArray(data)) return DEFAULT_TRIGGER_FOODS
  return data.filter((item): item is string => typeof item === 'string')
}

export function saveTriggerFoods(foods: string[]): void {
  writeJson(TRIGGER_FOODS_KEY, foods)
}

export function loadUserName(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_NAME_KEY)
    if (!raw) return null
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch {
    return null
  }
}

export function saveUserName(name: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USER_NAME_KEY, name.trim())
  } catch {
    // Quota exceeded or private browsing
  }
}

export { DEFAULT_TRIGGER_FOODS }
