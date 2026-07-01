export interface RecipeContent {
  title: string
  cookTime: string
  totalFat: string
  ingredients: string[]
  instructions: string[]
  safetyNote: string
}

export interface GeneratedRecipe extends RecipeContent {
  substitutionApplied: boolean
  substitutionReason: string
  /** Full recipe keeping the user's original ingredients — required when substitutionApplied is true. */
  withoutSubstitution?: RecipeContent
}

export type RecipeGenerationErrorCode =
  | 'MISSING_API_KEY'
  | 'API_ERROR'
  | 'INVALID_RESPONSE'
  | 'NETWORK_ERROR'

export type RecipeGenerationResponse =
  | { success: true; recipe: GeneratedRecipe }
  | { success: false; error: string; code: RecipeGenerationErrorCode }

export type CookingMethodPreference =
  | 'auto'
  | 'air_fryer'
  | 'saucepan'
  | 'oven'
  | 'steam'
  | 'grill'

export interface RecipeGenerationInput {
  ingredients: { name: string; amount: string; fatGrams?: number }[]
  cookingFat: boolean
  digestiveTriggers: boolean
  cookingMethod: CookingMethodPreference
  mealTotalFat?: number
  /** When set, ignore ingredients and generate a random recipe for this meal time. */
  randomOccasion?: MealOccasion
}

export type MealOccasion = 'breakfast' | 'lunch' | 'tea' | 'snack'
