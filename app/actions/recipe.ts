'use server'

import Groq from 'groq-sdk'
import { cookingMethodPromptLine } from '@/lib/cooking-methods'
import { mealOccasionPrompt } from '@/lib/meal-occasions'
import type {
  GeneratedRecipe,
  RecipeContent,
  RecipeGenerationInput,
  RecipeGenerationResponse,
} from '@/lib/types/recipe'

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are a talented, professional chef and a clinical dietitian specializing in gallbladder health. You generate mouth-watering, realistic recipes that taste like normal, comforting home-cooked food, while strictly keeping total fat content between 0g and 5g per serving.

CULINARY & FLAVOUR RULES:
1. PERMITTED PANTRY STAPLES: You are explicitly allowed—and heavily encouraged—to add naturally fat-free or ultra-low-fat base ingredients to make the meal delicious, EVEN IF the user did not select them. You may freely add: tinned chopped tomatoes, tomato purée, onions, garlic, carrots, celery, fresh or dried herbs, soy sauce, balsamic vinegar, lemon juice, chili flakes, and fat-free stocks.
2. NORMAL COOKING MECHANICS: Stop trying to cook everything inside the air fryer if it doesn't make culinary sense. For sauces (like a Bolognese or pasta sauce), instruct the user to simmer the ingredients in a saucepan or frying pan using a splash of water, light stock, or a single spray of low-fat oil to soften the onions and garlic. Use the air fryer for crisping proteins or vegetables.
3. ADULT PALATE: The food must taste rich and flavorful. Use herbs, reductions, and aromatic bases so the user doesn't feel like they are on a restrictive medical diet.

Your response must remain a clean, single JSON object matching this structure:
{
  "title": "Recipe Name",
  "cookTime": "X minutes",
  "totalFat": "Xg",
  "substitutionApplied": true,
  "substitutionReason": "Swapped 5% Beef Mince for Turkey Mince because...",
  "ingredients": ["Item 1 with exact weight/measurement", "Item 2..."],
  "instructions": ["Step 1...", "Step 2..."],
  "safetyNote": "Brief explanation of why this recipe is safe for a gallstone flare-up",
  "withoutSubstitution": {
    "title": "Recipe Name (your ingredients)",
    "cookTime": "X minutes",
    "totalFat": "Xg",
    "ingredients": ["User's original items with exact weights..."],
    "instructions": ["Steps using original ingredients..."],
    "safetyNote": "Honest note if fat may exceed 5g with originals"
  }
}

When substitutionApplied is true, you MUST include withoutSubstitution — a complete alternate recipe using the user's ORIGINAL ingredients with no swaps. When substitutionApplied is false, omit withoutSubstitution and set substitutionReason to "".`

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) return null
  return new Groq({ apiKey })
}

function buildUserPrompt(input: RecipeGenerationInput): string {
  if (input.randomOccasion) {
    const lines: string[] = [mealOccasionPrompt(input.randomOccasion), '']

    const methodLine = cookingMethodPromptLine(input.cookingMethod)
    if (methodLine) lines.push(methodLine)

    if (input.digestiveTriggers) {
      lines.push(
        'Note: prefer gentle, non-irritating options — avoid heavy coffee, spice, or acidic triggers.'
      )
    }

    lines.push('')
    lines.push(
      'Vary your choice each time — avoid repeating the same dish. Make it taste like comforting home-cooked UK food. Adult portions. Keep total fat per serving at or below 5g. Do not set substitutionApplied to true.'
    )
    return lines.join('\n')
  }

  const lines: string[] = [
    'Generate one gallstone-safe recipe using the context below.',
    '',
  ]

  if (input.ingredients.length > 0) {
    lines.push('Available ingredients the user has selected:')
    for (const item of input.ingredients) {
      const fatPart =
        item.fatGrams !== undefined ? ` (${item.fatGrams.toFixed(1)}g fat)` : ''
      lines.push(`- ${item.name}: ${item.amount}${fatPart}`)
    }
    lines.push('')
  } else {
    lines.push(
      'The user has not selected specific ingredients yet. Suggest a simple, practical low-fat meal suitable for gallstone management.'
    )
    lines.push('')
  }

  if (input.cookingFat) {
    lines.push(
      'Note: The user was considering added cooking fat — your recipe must NOT include butter, oil frying, or added fats.'
    )
  }

  if (input.digestiveTriggers) {
    lines.push(
      'Note: The meal may include coffee, spicy ingredients, or acidic foods — prefer gentle, non-irritating options where possible.'
    )
  }

  const methodLine = cookingMethodPromptLine(input.cookingMethod)
  if (methodLine) {
    lines.push(methodLine)
  }

  if (input.mealTotalFat !== undefined) {
    lines.push(`Current tracked meal fat total: ${input.mealTotalFat.toFixed(1)}g.`)
    if (input.mealTotalFat <= 5) {
      lines.push(
        'The user\'s selected ingredients already total at or under 5g fat — keep their original ingredients; do NOT substitute unless adult portion sizing would push the meal over 5g.'
      )
    } else {
      lines.push(
        'The user\'s selected ingredients exceed 5g fat — substitute only as needed to bring the recipe under 5g while keeping adult-sized portions.'
      )
    }
  }

  lines.push('')
  lines.push(
    'Make it taste like comforting home-cooked food—add pantry staples (onion, garlic, herbs, tinned tomatoes, stock) even if not selected. Use saucepan simmering for sauces; air fryer only where it makes sense. Adult portions (protein 100–150g, carbs 75–100g dry). Only substitute when combined fat exceeds 5g. Keep total fat per serving at or below 5g.'
  )

  return lines.join('\n')
}

function isRecipeContent(value: unknown): value is RecipeContent {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.title === 'string' &&
    typeof r.cookTime === 'string' &&
    typeof r.totalFat === 'string' &&
    Array.isArray(r.ingredients) &&
    r.ingredients.every((i) => typeof i === 'string') &&
    Array.isArray(r.instructions) &&
    r.instructions.every((i) => typeof i === 'string') &&
    typeof r.safetyNote === 'string'
  )
}

function isGeneratedRecipe(value: unknown): value is GeneratedRecipe {
  if (!isRecipeContent(value)) return false
  const r = value as Record<string, unknown>
  if (r.substitutionApplied === true && r.withoutSubstitution !== undefined) {
    return isRecipeContent(r.withoutSubstitution)
  }
  return true
}

function normalizeRecipe(value: Record<string, unknown>): GeneratedRecipe {
  const substitutionApplied = value.substitutionApplied === true
  const withoutSubstitution =
    substitutionApplied && isRecipeContent(value.withoutSubstitution)
      ? (value.withoutSubstitution as RecipeContent)
      : undefined

  return {
    title: value.title as string,
    cookTime: value.cookTime as string,
    totalFat: value.totalFat as string,
    substitutionApplied,
    substitutionReason:
      typeof value.substitutionReason === 'string' ? value.substitutionReason : '',
    ingredients: value.ingredients as string[],
    instructions: value.instructions as string[],
    safetyNote: value.safetyNote as string,
    withoutSubstitution,
  }
}

function finalizeRecipe(
  recipe: GeneratedRecipe,
  input: RecipeGenerationInput
): GeneratedRecipe {
  if (!input.randomOccasion) return recipe
  return {
    ...recipe,
    substitutionApplied: false,
    substitutionReason: '',
    withoutSubstitution: undefined,
  }
}

export async function generateSafeRecipe(
  input: RecipeGenerationInput
): Promise<RecipeGenerationResponse> {
  const client = getGroqClient()
  if (!client) {
    return {
      success: false,
      error:
        'GROQ_API_KEY is not configured. Save it in .env.local as GROQ_API_KEY=your_key, then restart the dev server (npm run dev).',
      code: 'MISSING_API_KEY',
    }
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: input.randomOccasion ? 0.9 : 0.6,
      max_tokens: 2048,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return {
        success: false,
        error: 'Groq returned an empty response. Please try again.',
        code: 'INVALID_RESPONSE',
      }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return {
        success: false,
        error: 'Could not parse the recipe response. Please try again.',
        code: 'INVALID_RESPONSE',
      }
    }

    if (!isGeneratedRecipe(parsed)) {
      return {
        success: false,
        error: 'The recipe response was missing required fields. Please try again.',
        code: 'INVALID_RESPONSE',
      }
    }

    return { success: true, recipe: finalizeRecipe(normalizeRecipe(parsed as Record<string, unknown>), input) }
  } catch (error) {
    console.error('[generateSafeRecipe]', error)
    return {
      success: false,
      error: 'Unable to generate a recipe right now. Please try again.',
      code: 'API_ERROR',
    }
  }
}
