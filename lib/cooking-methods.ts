import type { CookingMethodPreference } from '@/lib/types/recipe'

export const COOKING_METHOD_OPTIONS: {
  value: CookingMethodPreference
  label: string
  hint: string
}[] = [
  { value: 'auto', label: 'Let AI choose', hint: 'Picks the best method for the dish' },
  { value: 'air_fryer', label: 'Air fryer', hint: 'Crisp proteins and vegetables with minimal fat' },
  { value: 'saucepan', label: 'Hob / saucepan', hint: 'Simmer sauces, soups, and one-pot meals' },
  { value: 'oven', label: 'Oven bake', hint: 'Bake, roast, or tray-bake without deep frying' },
  { value: 'steam', label: 'Steam', hint: 'Gentle steaming for fish, veg, and rice' },
  { value: 'grill', label: 'Grill', hint: 'Grill or griddle with draining fat away' },
]

const PROMPT_BY_METHOD: Record<Exclude<CookingMethodPreference, 'auto'>, string> = {
  air_fryer:
    'The user wants to cook primarily in an AIR FRYER. Give exact air fryer temperature (°C) and timing. Use zero-fat or single-spray light oil only.',
  saucepan:
    'The user wants to cook primarily on the HOB in a SAUCEPAN or frying pan. Simmer with water, light stock, or a single spray of low-fat oil — no deep frying.',
  oven:
    'The user wants to cook primarily in the OVEN. Provide baking/roasting temperature (°C) and timing on a tray or dish with no added butter or heavy oils.',
  steam:
    'The user wants to STEAM ingredients. Include steamer or hob-steaming instructions with timing.',
  grill:
    'The user wants to GRILL or griddle. Instruct to drain visible fat; no basting with butter or oil.',
}

export function cookingMethodPromptLine(method: CookingMethodPreference): string | null {
  if (method === 'auto') return null
  return PROMPT_BY_METHOD[method]
}

export function isCookingMethodPreference(value: string): value is CookingMethodPreference {
  return COOKING_METHOD_OPTIONS.some((opt) => opt.value === value)
}
