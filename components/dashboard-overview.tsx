"use client"

import { ChefHat, Info, ArrowRight, FlameKindling } from "lucide-react"
import { FatTrackerCard } from "@/components/fat-tracker-card"
import { MealPortionSelector } from "@/components/meal-portion-selector"
import { cn } from "@/lib/utils"
import type { PortionPreset } from "@/lib/nutrition"
import {
  COOKING_FAT_GRAMS,
  FAT_THRESHOLD_CAUTION,
  FAT_THRESHOLD_SAFE,
  computeItemNutrition,
  getThresholdState,
} from "@/lib/nutrition"
import type { FatTotals } from "@/lib/types/food"
import type { SelectedIngredient } from "@/components/meal-creator"
import type { SavedMeal } from "@/components/saved-meals"

interface DashboardOverviewProps {
  userName?: string
  totals: FatTotals
  fullTotals: FatTotals
  portionPercent: number
  portionProps: {
    preset: PortionPreset
    customPercent: number
    onPresetChange: (preset: PortionPreset) => void
    onCustomPercentChange: (percent: number) => void
  }
  selected: SelectedIngredient[]
  cookingFat: boolean
  recentMeals: SavedMeal[]
  onGoToCreator: () => void
  onGoToSaved: () => void
}

const COOKING_TIPS = [
  "Bake, steam or grill rather than frying",
  "Avoid butter, cream, and full-fat dairy",
  "Skin poultry before cooking",
  "Choose white fish over oily fish",
  "Use non-stick pans to avoid added fat",
]

function mealStatusLabel(fat: number): { label: string; className: string } {
  const state = getThresholdState(fat)
  if (state === "safe") return { label: "Safe", className: "text-[oklch(0.4_0.13_155)] bg-[oklch(0.9_0.08_145)]" }
  if (state === "caution") return { label: "Caution", className: "text-[oklch(0.42_0.14_65)] bg-[oklch(0.93_0.1_80)]" }
  return { label: "High Risk", className: "text-[oklch(0.45_0.18_27)] bg-[oklch(0.93_0.07_25)]" }
}

export function DashboardOverview({
  userName,
  totals,
  fullTotals,
  portionPercent,
  portionProps,
  selected,
  cookingFat,
  recentMeals,
  onGoToCreator,
  onGoToSaved,
}: DashboardOverviewProps) {
  const hasMeal = selected.length > 0 || cookingFat
  const previewMeals = recentMeals.slice(0, 3)
  const portionFactor = portionPercent / 100

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {userName && (
        <p className="text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{userName}</span>. Here is
          how your meal is looking today.
        </p>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-[oklch(0.94_0.04_155)] border border-[oklch(0.82_0.08_155)] px-4 py-3">
        <Info size={15} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
        <p className="text-xs text-foreground leading-relaxed">
          <strong className="text-foreground">Key rule:</strong> Keep each meal under{" "}
          <strong className="text-[oklch(0.4_0.13_155)]">{FAT_THRESHOLD_SAFE}g total fat</strong>{" "}
          for the lowest risk. Fat over{" "}
          <strong className="text-[oklch(0.45_0.18_27)]">{FAT_THRESHOLD_CAUTION}g per meal</strong>{" "}
          can trigger a gallbladder contraction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <MealPortionSelector {...portionProps} />
          <FatTrackerCard
            totals={totals}
            fullTotals={fullTotals}
            portionPercent={portionPercent}
          />

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground text-base">Current Meal</h2>
                {portionPercent < 100 && hasMeal && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Full recipe below · totals scaled to {portionPercent}% portion
                  </p>
                )}
              </div>
              <button
                onClick={onGoToCreator}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ChefHat size={14} aria-hidden="true" />
                {hasMeal ? "Edit Meal" : "Build Meal"}
              </button>
            </div>

            {hasMeal ? (
              <ul className="space-y-2" aria-label="Current meal ingredients">
                {selected.map((item) => {
                  const itemNutrition = computeItemNutrition(item)
                  const fat = itemNutrition.fat * portionFactor
                  return (
                    <li
                      key={item.uid}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium text-foreground truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {itemNutrition.effectiveGrams !== null
                          ? `${(itemNutrition.effectiveGrams * portionFactor).toFixed(0)}g`
                          : "—"}
                      </span>
                      <span className="text-xs font-semibold text-[oklch(0.4_0.13_155)] shrink-0">
                        {itemNutrition.servingWarning ? "—" : `${fat.toFixed(1)}g fat`}
                      </span>
                    </li>
                  )
                })}
                {cookingFat && (
                  <li className="flex items-center justify-between gap-3 rounded-xl border border-[oklch(0.75_0.13_80)] bg-[oklch(0.97_0.04_80)] px-3 py-2.5 text-sm">
                    <span className="font-medium text-[oklch(0.45_0.14_65)] italic">
                      Cooking fat (1 tsp olive oil)
                    </span>
                    <span className="text-xs font-semibold text-[oklch(0.5_0.14_65)]">
                      {(COOKING_FAT_GRAMS * portionFactor).toFixed(1)}g fat
                    </span>
                  </li>
                )}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 py-8 text-center">
                <FlameKindling size={28} className="text-muted-foreground/50" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No ingredients in your current meal yet.</p>
                <button
                  onClick={onGoToCreator}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Open Meal Creator
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Ingredients" value={String(selected.length)} />
            <StatTile
              label={portionPercent < 100 ? "Sat. Fat (portion)" : "Saturated Fat"}
              value={`${totals.saturatedFat.toFixed(1)}g`}
            />
            <StatTile
              label={portionPercent < 100 ? "Calories (portion)" : "Calories"}
              value={`${Math.round(totals.calories)}`}
              unit="kcal"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Safe Cooking Tips
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              {COOKING_TIPS.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span
                    className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-primary inline-block"
                    aria-hidden="true"
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Saved Meals
              </h3>
              {recentMeals.length > 0 && (
                <button
                  onClick={onGoToSaved}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all
                </button>
              )}
            </div>

            {previewMeals.length > 0 ? (
              <ul className="space-y-2">
                {previewMeals.map((meal) => {
                  const { label, className } = mealStatusLabel(meal.totalFat)
                  return (
                    <li
                      key={meal.id}
                      className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {meal.totalFat.toFixed(1)}g fat
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", className)}>
                          {label}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Save meals from the Meal Creator to see them here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-lg font-bold text-foreground leading-none">
        {value}
        {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}
