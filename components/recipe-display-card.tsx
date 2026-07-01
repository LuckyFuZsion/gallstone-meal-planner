"use client"

import { ChefHat, Clock, ShieldCheck, AlertCircle } from "lucide-react"
import type { GeneratedRecipe } from "@/lib/types/recipe"
import { cn } from "@/lib/utils"
import { getThresholdState } from "@/lib/nutrition"

interface RecipeDisplayCardProps {
  recipe: GeneratedRecipe
  className?: string
}

function parseFatGrams(totalFat: string): number | null {
  const match = totalFat.match(/([\d.]+)/)
  if (!match) return null
  const n = Number.parseFloat(match[1])
  return Number.isFinite(n) ? n : null
}

export function RecipeDisplayCard({ recipe, className }: RecipeDisplayCardProps) {
  const fatGrams = parseFatGrams(recipe.totalFat)
  const fatState = fatGrams !== null ? getThresholdState(fatGrams) : 'safe'

  const fatClass =
    fatState === 'safe'
      ? 'text-[oklch(0.4_0.13_155)] bg-[oklch(0.9_0.08_145)]'
      : fatState === 'caution'
        ? 'text-[oklch(0.42_0.14_65)] bg-[oklch(0.93_0.1_80)]'
        : 'text-[oklch(0.45_0.18_27)] bg-[oklch(0.93_0.07_25)]'

  return (
    <article
      className={cn(
        'rounded-2xl border border-[oklch(0.82_0.08_155)] bg-[oklch(0.97_0.03_155)] overflow-hidden',
        className
      )}
      aria-label={`Generated recipe: ${recipe.title}`}
    >
      {recipe.substitutionApplied && (
        <div
          role="status"
          className="border-b border-[oklch(0.82_0.1_80)] bg-[oklch(0.97_0.04_80)] px-4 py-3"
        >
          <p className="flex items-start gap-2 text-xs text-[oklch(0.42_0.1_65)] leading-relaxed">
            <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Notice:</strong> The AI adjusted your ingredient
              list slightly to guarantee this meal stays under your strict 5g gallstone trigger
              limit.
              {recipe.substitutionReason ? (
                <span className="mt-1 block text-[oklch(0.38_0.08_65)]">
                  {recipe.substitutionReason}
                </span>
              ) : null}
            </span>
          </p>
        </div>
      )}

      <header className="border-b border-[oklch(0.88_0.06_155)] bg-card/80 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <ChefHat size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground text-base leading-snug">{recipe.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} aria-hidden="true" />
                {recipe.cookTime}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', fatClass)}>
                {recipe.totalFat} fat / serving
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <section aria-labelledby="recipe-ingredients-heading">
          <h4
            id="recipe-ingredients-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Ingredients
          </h4>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((item, index) => (
              <li key={index} className="text-sm text-foreground leading-snug flex gap-2">
                <span className="text-muted-foreground shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recipe-instructions-heading">
          <h4
            id="recipe-instructions-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
          >
            Instructions
          </h4>
          <ol className="space-y-2">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="text-sm text-foreground leading-snug flex gap-2">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-[oklch(0.88_0.06_155)] bg-card/60 px-4 py-3">
        <p className="flex items-start gap-2 text-xs text-foreground leading-relaxed">
          <ShieldCheck size={14} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-medium">Safety note:</strong> {recipe.safetyNote}
          </span>
        </p>
      </footer>
    </article>
  )
}
