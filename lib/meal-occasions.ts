import type { MealOccasion } from '@/lib/types/recipe'

export const MEAL_OCCASION_OPTIONS: {
  value: MealOccasion
  label: string
  emoji: string
  description: string
}[] = [
  {
    value: 'breakfast',
    label: 'Breakfast',
    emoji: '🌅',
    description: 'Morning start — porridge, eggs, toast alternatives, fruit',
  },
  {
    value: 'lunch',
    label: 'Lunch',
    emoji: '☀️',
    description: 'Midday meal — soups, salads, wraps, light proteins',
  },
  {
    value: 'tea',
    label: 'Tea',
    emoji: '🍽️',
    description: 'Evening meal — comforting UK dinner plates',
  },
  {
    value: 'snack',
    label: 'Snack',
    emoji: '🍎',
    description: 'Light bite between meals',
  },
]

export function mealOccasionPrompt(occasion: MealOccasion): string {
  switch (occasion) {
    case 'breakfast':
      return 'Generate a RANDOM gallstone-safe BREAKFAST recipe suitable for a UK morning. Pick a varied, appealing idea (e.g. porridge, egg-white omelette, low-fat yogurt bowl, beans on toast with no butter). The user has NOT selected ingredients — choose appropriate items yourself. Set substitutionApplied to false and substitutionReason to "".'
    case 'lunch':
      return 'Generate a RANDOM gallstone-safe LUNCH recipe suitable for a UK midday meal. Pick a varied, appealing idea (e.g. soup, salad with lean protein, jacket potato with filling, light pasta). The user has NOT selected ingredients — choose appropriate items yourself. Set substitutionApplied to false and substitutionReason to "".'
    case 'tea':
      return 'Generate a RANDOM gallstone-safe TEA (evening dinner) recipe suitable for a UK home-cooked evening meal. Pick a varied, comforting idea (e.g. lean bolognese, baked fish, stir-fry, cottage pie with lean mince). The user has NOT selected ingredients — choose appropriate items yourself. Set substitutionApplied to false and substitutionReason to "".'
    case 'snack':
      return 'Generate a RANDOM gallstone-safe SNACK recipe — a small portion between meals. Pick a varied idea (e.g. rice cakes with cottage cheese, fruit, low-fat hummus and veg sticks). The user has NOT selected ingredients — choose appropriate items yourself. Set substitutionApplied to false and substitutionReason to "".'
  }
}
