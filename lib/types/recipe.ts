export interface GeneratedRecipe {
  title: string
  cookTime: string
  totalFat: string
  substitutionApplied: boolean
  substitutionReason: string
  ingredients: string[]
  instructions: string[]
  safetyNote: string
}

export type RecipeGenerationErrorCode =
  | 'MISSING_API_KEY'
  | 'API_ERROR'
  | 'INVALID_RESPONSE'
  | 'NETWORK_ERROR'

export type RecipeGenerationResponse =
  | { success: true; recipe: GeneratedRecipe }
  | { success: false; error: string; code: RecipeGenerationErrorCode }

export interface RecipeGenerationInput {
  ingredients: { name: string; amount: string; fatGrams?: number }[]
  cookingFat: boolean
  digestiveTriggers: boolean
  mealTotalFat?: number
}
