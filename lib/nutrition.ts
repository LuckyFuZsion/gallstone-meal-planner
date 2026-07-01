import type { FatTotals, ItemNutrition, SelectedFood } from '@/lib/types/food'
import { GRAMS_ACCURACY_WARNING } from '@/lib/types/food'

/** Gallstone-safe meal fat thresholds (grams per meal). */
export const FAT_THRESHOLD_SAFE = 3
export const FAT_THRESHOLD_CAUTION = 8

/** High-sugar warning threshold (grams per 100g, UK FSA "high" for foods). */
export const HIGH_SUGAR_THRESHOLD_100G = 22

export const COOKING_FAT_GRAMS = 4.5

export function isHighSugar(sugarsPer100g: number | null): boolean {
  return sugarsPer100g !== null && sugarsPer100g > HIGH_SUGAR_THRESHOLD_100G
}

export type ThresholdState = 'safe' | 'caution' | 'danger'

export function getThresholdState(totalFat: number): ThresholdState {
  if (totalFat < FAT_THRESHOLD_SAFE) return 'safe'
  if (totalFat <= FAT_THRESHOLD_CAUTION) return 'caution'
  return 'danger'
}

export function fatForGrams(per100g: number, grams: number): number {
  return (per100g * grams) / 100
}

function nutrientForGrams(per100g: number | null, grams: number): number {
  if (per100g === null) return 0
  return (per100g * grams) / 100
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value))
}

/** Fat / sat fat / calories for one selected ingredient based on its serving mode. */
export function computeItemNutrition(item: SelectedFood): ItemNutrition {
  if (item.measurementType === 'grams') {
    const grams = Math.max(0, item.amount)
    return {
      fat: fatForGrams(item.fatPer100g, grams),
      saturatedFat: fatForGrams(item.satFatPer100g, grams),
      calories: fatForGrams(item.calsPer100g, grams),
      sugars: nutrientForGrams(item.sugarsPer100g, grams),
      fibre: nutrientForGrams(item.fibrePer100g, grams),
      effectiveGrams: grams,
      servingWarning: null,
    }
  }

  const pct = clampPercent(item.amount) / 100

  if (item.measurementType === 'percent_item') {
    if (item.fatPerServing !== null && item.servingQuantityGrams !== null) {
      return {
        fat: item.fatPerServing * pct,
        saturatedFat: (item.satFatPerServing ?? item.fatPerServing) * pct,
        calories: (item.calsPerServing ?? 0) * pct,
        sugars: (item.sugarsPerServing ?? 0) * pct,
        fibre: (item.fibrePerServing ?? 0) * pct,
        effectiveGrams: item.servingQuantityGrams * pct,
        servingWarning: null,
      }
    }

    if (item.servingQuantityGrams !== null) {
      const grams = item.servingQuantityGrams * pct
      return {
        fat: fatForGrams(item.fatPer100g, grams),
        saturatedFat: fatForGrams(item.satFatPer100g, grams),
        calories: fatForGrams(item.calsPer100g, grams),
        sugars: nutrientForGrams(item.sugarsPer100g, grams),
        fibre: nutrientForGrams(item.fibrePer100g, grams),
        effectiveGrams: grams,
        servingWarning: null,
      }
    }

    return {
      fat: 0,
      saturatedFat: 0,
      calories: 0,
      sugars: 0,
      fibre: 0,
      effectiveGrams: null,
      servingWarning: GRAMS_ACCURACY_WARNING,
    }
  }

  // percent_pack
  if (item.packWeightGrams === null) {
    return {
      fat: 0,
      saturatedFat: 0,
      calories: 0,
      sugars: 0,
      fibre: 0,
      effectiveGrams: null,
      servingWarning: GRAMS_ACCURACY_WARNING,
    }
  }

  const grams = item.packWeightGrams * pct
  return {
    fat: fatForGrams(item.fatPer100g, grams),
    saturatedFat: fatForGrams(item.satFatPer100g, grams),
    calories: fatForGrams(item.calsPer100g, grams),
    sugars: nutrientForGrams(item.sugarsPer100g, grams),
    fibre: nutrientForGrams(item.fibrePer100g, grams),
    effectiveGrams: grams,
    servingWarning: null,
  }
}

export function computeMealTotals(
  items: SelectedFood[],
  cookingFat: boolean
): FatTotals {
  let totalFat = 0
  let saturatedFat = 0
  let calories = 0
  let totalSugars = 0
  let totalFibre = 0

  for (const item of items) {
    const nutrition = computeItemNutrition(item)
    if (nutrition.servingWarning) continue
    totalFat += nutrition.fat
    saturatedFat += nutrition.saturatedFat
    calories += nutrition.calories
    totalSugars += nutrition.sugars
    totalFibre += nutrition.fibre
  }

  if (cookingFat) {
    totalFat += COOKING_FAT_GRAMS
  }

  return { totalFat, saturatedFat, calories, totalSugars, totalFibre }
}

export type PortionPreset = 'whole' | '75' | '50' | '25' | 'custom'

export function resolvePortionPercent(
  preset: PortionPreset,
  customPercent: number
): number {
  switch (preset) {
    case 'whole':
      return 100
    case '75':
      return 75
    case '50':
      return 50
    case '25':
      return 25
    case 'custom':
      return Math.min(100, Math.max(1, customPercent))
  }
}

export function applyPortionToTotals(
  totals: FatTotals,
  portionPercent: number
): FatTotals {
  const factor = portionPercent / 100
  return {
    totalFat: totals.totalFat * factor,
    saturatedFat: totals.saturatedFat * factor,
    calories: totals.calories * factor,
    totalSugars: totals.totalSugars * factor,
    totalFibre: totals.totalFibre * factor,
  }
}
