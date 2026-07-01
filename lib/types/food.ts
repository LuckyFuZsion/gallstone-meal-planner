/** Per-100g nutrition baseline from Open Food Facts. */
export interface FoodNutritionPer100g {
  fatPer100g: number
  satFatPer100g: number
  calsPer100g: number
  sugarsPer100g: number | null
  fibrePer100g: number | null
  hasNutrientData: boolean
}

/** Per-serving nutrition from Open Food Facts (when available). */
export interface FoodNutritionPerServing {
  fatPerServing: number | null
  satFatPerServing: number | null
  calsPerServing: number | null
  sugarsPerServing: number | null
  fibrePerServing: number | null
  servingQuantityGrams: number | null
  packWeightGrams: number | null
}

export type ServingMeasurementType = 'grams' | 'percent_pack' | 'percent_item'

/** Unified food item returned from search and consumed by the UI. */
export interface FoodItem extends FoodNutritionPer100g, FoodNutritionPerServing {
  productCode: string
  name: string
  brand: string
  servingSize: number
  servingSizeUnit: string
}

export interface SelectedFood extends FoodItem {
  uid: string
  measurementType: ServingMeasurementType
  /** Grams when type is `grams`; percentage (0–100) when type is `percent_*`. */
  amount: number
}

export interface FatTotals {
  totalFat: number
  saturatedFat: number
  calories: number
  totalSugars: number
  totalFibre: number
}

export interface ItemNutrition {
  fat: number
  saturatedFat: number
  calories: number
  sugars: number
  fibre: number
  effectiveGrams: number | null
  servingWarning: string | null
}

export type FoodSearchErrorCode = 'EMPTY_QUERY' | 'API_ERROR' | 'NETWORK_ERROR' | 'RATE_LIMITED'

export type FoodSearchResponse =
  | { success: true; foods: FoodItem[] }
  | { success: false; error: string; code: FoodSearchErrorCode }

export const GRAMS_ACCURACY_WARNING =
  'Please enter weight in grams for accuracy.'
