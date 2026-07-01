"use client"

import { useState } from "react"
import { Shuffle, CookingPot, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateSafeRecipe } from "@/app/actions/recipe"
import { RecipeDisplayCard } from "@/components/recipe-display-card"
import { COOKING_METHOD_OPTIONS } from "@/lib/cooking-methods"
import { MEAL_OCCASION_OPTIONS } from "@/lib/meal-occasions"
import type { GeneratedRecipe, CookingMethodPreference, MealOccasion } from "@/lib/types/recipe"

interface RandomMealIdeasProps {
  cookingMethod: CookingMethodPreference
  digestiveTriggers: boolean
  onCookingMethodChange: (method: CookingMethodPreference) => void
}

export function RandomMealIdeas({
  cookingMethod,
  digestiveTriggers,
  onCookingMethodChange,
}: RandomMealIdeasProps) {
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [generatingOccasion, setGeneratingOccasion] = useState<MealOccasion | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)

  async function handleGenerate(occasion: MealOccasion) {
    setIsGenerating(true)
    setRecipeError(null)
    setGeneratingOccasion(occasion)

    const response = await generateSafeRecipe({
      ingredients: [],
      cookingFat: false,
      digestiveTriggers,
      cookingMethod,
      randomOccasion: occasion,
    })

    setIsGenerating(false)
    setGeneratingOccasion(null)

    if (!response.success) {
      setRecipeError(response.error)
      return
    }

    setRecipe(response.recipe)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-2.5">
          <Shuffle size={20} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Pick a meal type</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              No ingredients needed — get a surprise low-fat recipe for breakfast, lunch, tea, or a
              snack (0–5g fat per serving).
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CookingPot size={16} className="text-primary shrink-0" aria-hidden="true" />
            Preferred cooking method
          </span>
          <select
            value={cookingMethod}
            onChange={(e) =>
              onCookingMethodChange(e.target.value as CookingMethodPreference)
            }
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Preferred cooking method for random recipe"
          >
            {COOKING_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-muted-foreground leading-snug">
            {COOKING_METHOD_OPTIONS.find((o) => o.value === cookingMethod)?.hint}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MEAL_OCCASION_OPTIONS.map((occ) => {
            const isLoading = isGenerating && generatingOccasion === occ.value
            return (
              <button
                key={occ.value}
                type="button"
                title={occ.description}
                disabled={isGenerating}
                onClick={() => void handleGenerate(occ.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors",
                  isGenerating && !isLoading
                    ? "border-border bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60"
                    : "border-border bg-card hover:bg-accent hover:border-primary/30 text-foreground"
                )}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-primary" aria-hidden="true" />
                ) : (
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {occ.emoji}
                  </span>
                )}
                <span className="text-xs font-semibold">{occ.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {recipeError && (
        <p
          role="alert"
          className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          {recipeError}
        </p>
      )}

      {recipe && !isGenerating && (
        <RecipeDisplayCard
          recipe={recipe}
          substitutionChoice={null}
          onAcceptSubstitution={() => {}}
          onRejectSubstitution={() => {}}
        />
      )}
    </div>
  )
}
