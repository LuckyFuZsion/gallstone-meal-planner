'use server'

import { OpenFoodFactsError, searchOpenFoodFacts } from '@/lib/open-food-facts/client'
import type { FoodSearchResponse } from '@/lib/types/food'

export async function searchFoods(query: string): Promise<FoodSearchResponse> {
  const trimmed = query.trim()

  if (!trimmed) {
    return { success: false, error: 'Enter a food name to search.', code: 'EMPTY_QUERY' }
  }

  try {
    const foods = await searchOpenFoodFacts(trimmed)
    return { success: true, foods }
  } catch (error) {
    console.error('[searchFoods]', error)

    if (error instanceof OpenFoodFactsError && error.isRateLimited) {
      return {
        success: false,
        error:
          'Open Food Facts is temporarily busy (rate limit). Wait a few seconds and try again.',
        code: 'RATE_LIMITED',
      }
    }

    return {
      success: false,
      error: 'Unable to search foods right now. Please try again.',
      code: 'NETWORK_ERROR',
    }
  }
}
