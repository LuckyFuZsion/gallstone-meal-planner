"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Plus, Trash2, Flame, FlameKindling, Loader2, AlertCircle, Coffee, Sparkles, CookingPot } from "lucide-react"
import { cn } from "@/lib/utils"
import { searchFoods } from "@/app/actions/food-search"
import { getCachedFoodSearch, setCachedFoodSearch } from "@/lib/food-search-cache"
import { sortFoodItemsByQuery } from "@/lib/open-food-facts/client"
import { generateSafeRecipe } from "@/app/actions/recipe"
import { RecipeDisplayCard, type SubstitutionChoice } from "@/components/recipe-display-card"
import {
  COOKING_FAT_GRAMS,
  FAT_THRESHOLD_CAUTION,
  FAT_THRESHOLD_SAFE,
  computeItemNutrition,
  computeMealTotals,
  getThresholdState,
  isHighSugar,
} from "@/lib/nutrition"
import type { FoodItem, SelectedFood, ServingMeasurementType } from "@/lib/types/food"
import { COOKING_METHOD_OPTIONS } from "@/lib/cooking-methods"
import type { GeneratedRecipe, CookingMethodPreference } from "@/lib/types/recipe"

export type { SelectedFood as SelectedIngredient }

interface MealCreatorProps {
  selected: SelectedFood[]
  cookingFat: boolean
  digestiveTriggers: boolean
  cookingMethod: CookingMethodPreference
  onSelectedChange: (items: SelectedFood[]) => void
  onCookingFatChange: (val: boolean) => void
  onDigestiveTriggersChange: (val: boolean) => void
  onCookingMethodChange: (method: CookingMethodPreference) => void
}

const MEASUREMENT_OPTIONS: {
  value: ServingMeasurementType
  label: string
  shortLabel: string
}[] = [
  { value: "grams", label: "Grams", shortLabel: "g" },
  { value: "percent_pack", label: "% of pack", shortLabel: "% pack" },
  { value: "percent_item", label: "% of item", shortLabel: "% item" },
]

function defaultAmountForType(
  type: ServingMeasurementType,
  food: Pick<FoodItem, "servingQuantityGrams" | "packWeightGrams">
): number {
  switch (type) {
    case "grams":
      return food.servingQuantityGrams ?? 100
    case "percent_pack":
      return 50
    case "percent_item":
      return 100
  }
}

function isMeasurementAvailable(
  type: ServingMeasurementType,
  item: Pick<FoodItem, "servingQuantityGrams" | "packWeightGrams">
): boolean {
  if (type === "grams") return true
  if (type === "percent_pack") return item.packWeightGrams !== null
  return item.servingQuantityGrams !== null
}

function fatBadgeClass(fat: number): string {
  const state = getThresholdState(fat)
  if (state === "safe") return "bg-[oklch(0.9_0.08_145)] text-[oklch(0.4_0.13_155)]"
  if (state === "caution") return "bg-[oklch(0.93_0.1_80)] text-[oklch(0.42_0.14_65)]"
  return "bg-[oklch(0.93_0.07_25)] text-[oklch(0.45_0.18_27)]"
}

function HighSugarWarningBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-[oklch(0.82_0.1_80)] bg-[oklch(0.97_0.04_80)] px-2 py-0.5 text-[10px] font-medium text-[oklch(0.45_0.12_65)]">
      High sugar may increase bile cholesterol.
    </span>
  )
}

function ItemNutrientBadges({
  fat,
  saturatedFat,
  calories,
  sugars,
  fibre,
  per100g,
  showHighSugarWarning,
}: {
  fat: number
  saturatedFat: number
  calories: number
  sugars?: number | null
  fibre?: number | null
  per100g?: { fat: number; satFat: number; sugars?: number | null; fibre?: number | null }
  showHighSugarWarning?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", fatBadgeClass(fat))}>
          {fat.toFixed(1)}g fat
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {saturatedFat.toFixed(1)}g sat
        </span>
        {sugars !== undefined && sugars !== null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {sugars.toFixed(1)}g sugar
          </span>
        )}
        {fibre !== undefined && fibre !== null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {fibre.toFixed(1)}g fibre
          </span>
        )}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {Math.round(calories)} kcal
        </span>
        {per100g && (
          <span className="text-[10px] text-muted-foreground">
            ({per100g.fat.toFixed(1)}g fat / 100g
            {per100g.sugars !== undefined && per100g.sugars !== null
              ? ` · ${per100g.sugars.toFixed(1)}g sugar`
              : ""}
            {per100g.fibre !== undefined && per100g.fibre !== null
              ? ` · ${per100g.fibre.toFixed(1)}g fibre`
              : ""}
            )
          </span>
        )}
      </div>
      {showHighSugarWarning && <HighSugarWarningBadge />}
    </div>
  )
}

export function MealCreator({
  selected,
  cookingFat,
  digestiveTriggers,
  cookingMethod,
  onSelectedChange,
  onCookingFatChange,
  onDigestiveTriggersChange,
  onCookingMethodChange,
}: MealCreatorProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [resultsFromCache, setResultsFromCache] = useState(false)
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null)
  const [substitutionChoice, setSubstitutionChoice] = useState<SubstitutionChoice | null>(null)
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setResultsFromCache(false)

    const cached = getCachedFoodSearch(trimmed)
    if (cached) {
      const selectedIds = new Set(selected.map((s) => s.productCode))
      setResults(
        sortFoodItemsByQuery(cached, trimmed).filter(
          (food) => !selectedIds.has(food.productCode)
        )
      )
      setResultsFromCache(true)
      setIsSearching(false)
      return
    }

    const response = await searchFoods(trimmed)

    if (!response.success) {
      setResults([])
      setSearchError(response.code === "EMPTY_QUERY" ? null : response.error)
      setIsSearching(false)
      return
    }

    setCachedFoodSearch(trimmed, response.foods)

    const selectedIds = new Set(selected.map((s) => s.productCode))
    setResults(
      sortFoodItemsByQuery(response.foods, trimmed).filter(
        (food) => !selectedIds.has(food.productCode)
      )
    )
    setIsSearching(false)
  }, [selected])

  function submitSearch() {
    const trimmed = query.trim()
    setOpen(true)

    if (trimmed.length < 2) {
      setHasSearched(false)
      setResults([])
      setSearchError(null)
      return
    }

    setHasSearched(true)
    void runSearch(trimmed)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setOpen(true)
    setHasSearched(false)
    setResultsFromCache(false)
    setResults([])
    setSearchError(null)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function addIngredient(food: FoodItem) {
    const uid = `${food.productCode}-${Date.now()}`
    const amount = food.servingQuantityGrams ?? 100

    onSelectedChange([
      ...selected,
      {
        ...food,
        uid,
        measurementType: "grams",
        amount,
      },
    ])
    setQuery("")
    setResults([])
    setHasSearched(false)
    setOpen(false)
  }

  function removeIngredient(uid: string) {
    onSelectedChange(selected.filter((s) => s.uid !== uid))
  }

  function updateItem(
    uid: string,
    patch: Partial<Pick<SelectedFood, "measurementType" | "amount">>
  ) {
    onSelectedChange(
      selected.map((s) => {
        if (s.uid !== uid) return s
        if (patch.measurementType && patch.measurementType !== s.measurementType) {
          return {
            ...s,
            measurementType: patch.measurementType,
            amount: defaultAmountForType(patch.measurementType, s),
          }
        }
        return { ...s, ...patch }
      })
    )
  }

  const showDropdown =
    open && (hasSearched || isSearching || Boolean(searchError))

  const mealTotals = computeMealTotals(selected, cookingFat)

  async function handleGenerateRecipe() {
    setIsGeneratingRecipe(true)
    setRecipeError(null)
    setSubstitutionChoice(null)

    const ingredientPayload = selected.map((item) => {
      const nutrition = computeItemNutrition(item)
      const amountLabel =
        item.measurementType === "grams"
          ? `${item.amount}g`
          : `${item.amount}% of ${item.measurementType === "percent_pack" ? "pack" : "item"}`
      return {
        name: item.name,
        amount: amountLabel,
        fatGrams: nutrition.servingWarning ? undefined : nutrition.fat,
      }
    })

    const response = await generateSafeRecipe({
      ingredients: ingredientPayload,
      cookingFat,
      digestiveTriggers,
      cookingMethod,
      mealTotalFat: mealTotals.totalFat,
    })

    setIsGeneratingRecipe(false)

    if (!response.success) {
      setRecipeError(response.error)
      return
    }

    setRecipe(response.recipe)
    setSubstitutionChoice(response.recipe.substitutionApplied ? "pending" : null)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-foreground text-base">Gallstone-Safe Meal Creator</h2>
        <span className="text-xs text-muted-foreground shrink-0">
          {selected.length} ingredient{selected.length !== 1 ? "s" : ""} added
        </span>
      </div>

      {(selected.length > 0 || cookingFat) && (
        <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Meal total (full recipe)
          </p>
          <ItemNutrientBadges
            fat={mealTotals.totalFat}
            saturatedFat={mealTotals.saturatedFat}
            calories={mealTotals.calories}
            sugars={mealTotals.totalSugars}
            fibre={mealTotals.totalFibre}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative" ref={dropdownRef}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch()
          }}
        >
          <div className="relative flex flex-1 items-center min-w-0">
            <Search size={16} className="absolute left-3 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search UK foods… press Enter to search"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search foods"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              aria-busy={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || query.trim().length < 2}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              isSearching || query.trim().length < 2
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              "Search"
            )}
          </button>
        </form>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Press Enter or click Search — repeat searches use saved results when available.
        </p>

        {showDropdown && resultsFromCache && results.length > 0 && !isSearching && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Showing saved results from this device (no API request).
          </p>
        )}

        {showDropdown && isSearching && (
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin shrink-0" aria-hidden="true" />
            Searching Open Food Facts…
          </div>
        )}

        {showDropdown && searchError && (
          <div
            role="alert"
            className="mt-1.5 flex w-full items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-lg"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{searchError}</span>
          </div>
        )}

        {showDropdown && !searchError && results.length > 0 && (
          <ul
            role="listbox"
            className="mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-lg"
          >
            {results.map((item) => (
              <li key={item.productCode}>
                <button
                  role="option"
                  aria-selected="false"
                  disabled={!item.hasNutrientData}
                  onClick={() => addIngredient(item)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-2.5 text-sm transition-colors text-left",
                    item.hasNutrientData
                      ? "hover:bg-accent hover:text-accent-foreground"
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="font-medium text-foreground">{item.name}</span>
                  {item.hasNutrientData ? (
                    <>
                      <ItemNutrientBadges
                        fat={item.fatPer100g}
                        saturatedFat={item.satFatPer100g}
                        calories={item.calsPer100g}
                        sugars={item.sugarsPer100g}
                        fibre={item.fibrePer100g}
                        per100g={{
                          fat: item.fatPer100g,
                          satFat: item.satFatPer100g,
                          sugars: item.sugarsPer100g,
                          fibre: item.fibrePer100g,
                        }}
                        showHighSugarWarning={isHighSugar(item.sugarsPer100g)}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {item.servingQuantityGrams
                          ? `Serving ${item.servingQuantityGrams}g`
                          : `Serving ${item.servingSize}${item.servingSizeUnit}`}
                        {item.packWeightGrams ? ` · Pack ${item.packWeightGrams}g` : ""}
                        {item.fatPerServing !== null
                          ? ` · ${item.fatPerServing.toFixed(1)}g fat per serving`
                          : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No fat data</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {showDropdown && !searchError && !isSearching && hasSearched && results.length === 0 && (
          <div className="mt-1.5 w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-muted-foreground shadow-lg">
            No matching UK products found.
          </div>
        )}

        {open && !hasSearched && !isSearching && query.trim().length > 0 && query.trim().length < 2 && (
          <div className="mt-1.5 w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-muted-foreground shadow-lg">
            Type at least 2 characters, then press Enter.
          </div>
        )}
      </div>

      {/* Cooking fat toggle */}
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors",
          cookingFat
            ? "border-[oklch(0.75_0.13_80)] bg-[oklch(0.96_0.05_80)]"
            : "border-border bg-muted/40"
        )}
      >
        <div className="flex items-center gap-2.5">
          {cookingFat ? (
            <Flame size={18} className="text-[oklch(0.55_0.14_65)]" aria-hidden="true" />
          ) : (
            <FlameKindling size={18} className="text-muted-foreground" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">Cooking Fat Used?</p>
            <p className="text-xs text-muted-foreground">
              1 tsp olive oil adds +{COOKING_FAT_GRAMS}g fat
            </p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={cookingFat}
          onClick={() => onCookingFatChange(!cookingFat)}
          className={cn(
            "relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            cookingFat ? "bg-[oklch(0.7_0.13_80)]" : "bg-input"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
              cookingFat ? "translate-x-5" : "translate-x-0"
            )}
          />
          <span className="sr-only">Toggle cooking fat</span>
        </button>
      </div>

      {/* Coffee / spicy / acidic checkbox */}
      <div className="space-y-2">
        <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={digestiveTriggers}
            onChange={(e) => onDigestiveTriggersChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary focus:ring-2 focus:ring-ring"
          />
          <span className="flex items-start gap-2 min-w-0">
            <Coffee size={16} className="shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground leading-snug">
              Contains Coffee, Spicy Ingredients, or Acidic Foods
            </span>
          </span>
        </label>
        {digestiveTriggers && (
          <p className="flex items-start gap-1.5 rounded-lg border border-[oklch(0.85_0.06_80)] bg-[oklch(0.97_0.03_80)] px-3 py-2 text-[11px] text-[oklch(0.42_0.1_65)] leading-relaxed">
            <AlertCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
            Keep an eye on personal tolerance, as these can irritate the digestive tract during a
            flare-up.
          </p>
        )}
      </div>

      {/* Selected ingredients */}
      {selected.length > 0 ? (
        <ul className="space-y-2" aria-label="Selected ingredients">
          {selected.map((item) => {
            const nutrition = computeItemNutrition(item)
            const amountLabel =
              item.measurementType === "grams"
                ? `${item.amount}g`
                : `${item.amount}% of ${item.measurementType === "percent_pack" ? "pack" : "item"}`

            return (
              <li
                key={item.uid}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    {nutrition.servingWarning ? (
                      <span className="text-xs font-semibold text-muted-foreground">— fat unknown</span>
                    ) : (
                      <ItemNutrientBadges
                        fat={nutrition.fat}
                        saturatedFat={nutrition.saturatedFat}
                        calories={nutrition.calories}
                        sugars={item.sugarsPer100g !== null ? nutrition.sugars : null}
                        fibre={item.fibrePer100g !== null ? nutrition.fibre : null}
                        per100g={
                          item.hasNutrientData
                            ? {
                                fat: item.fatPer100g,
                                satFat: item.satFatPer100g,
                                sugars: item.sugarsPer100g,
                                fibre: item.fibrePer100g,
                              }
                            : undefined
                        }
                        showHighSugarWarning={isHighSugar(item.sugarsPer100g)}
                      />
                    )}
                    {!item.hasNutrientData && !nutrition.servingWarning && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">(estimated from available data)</p>
                    )}
                    {nutrition.effectiveGrams !== null && item.measurementType !== "grams" && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        ≈ {nutrition.effectiveGrams.toFixed(0)}g · {amountLabel}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeIngredient(item.uid)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={item.measurementType}
                    onChange={(e) =>
                      updateItem(item.uid, {
                        measurementType: e.target.value as ServingMeasurementType,
                      })
                    }
                    className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Measurement type for ${item.name}`}
                  >
                    {MEASUREMENT_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={!isMeasurementAvailable(opt.value, item)}
                      >
                        {opt.label}
                        {!isMeasurementAvailable(opt.value, item) ? " (unavailable)" : ""}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={item.measurementType === "grams" ? 5000 : 100}
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(item.uid, { amount: Number(e.target.value) })
                      }
                      className="w-20 rounded-lg border border-input bg-background px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`Amount for ${item.name}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.measurementType === "grams" ? "g" : "%"}
                    </span>
                  </div>

                  <span className="text-[10px] text-muted-foreground">{amountLabel}</span>
                </div>

                {nutrition.servingWarning && (
                  <p className="flex items-start gap-1.5 text-[11px] text-[oklch(0.45_0.18_27)]">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
                    {nutrition.servingWarning}
                  </p>
                )}
              </li>
            )
          })}
          {cookingFat && (
            <li className="flex items-center gap-3 rounded-xl border border-[oklch(0.75_0.13_80)] bg-[oklch(0.97_0.04_80)] px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[oklch(0.45_0.14_65)] italic">
                  Cooking fat (1 tsp olive oil)
                </p>
                <span className="text-xs font-semibold text-[oklch(0.5_0.14_65)]">
                  {COOKING_FAT_GRAMS}g fat
                </span>
              </div>
            </li>
          )}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-10">
          <Plus size={28} className="text-muted-foreground/50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Search UK supermarket products above to build your meal
          </p>
        </div>
      )}

      <label className="flex flex-col gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5">
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
          aria-label="Preferred cooking method for AI recipe"
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

      {/* AI Safe-Recipe Generator */}
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-2.5">
          <Sparkles size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">AI Safe-Recipe Generator</h3>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              Build a recipe from the ingredients you have added above.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleGenerateRecipe()}
          disabled={isGeneratingRecipe}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            isGeneratingRecipe
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isGeneratingRecipe ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Generating recipe…
            </>
          ) : (
            <>
              <Sparkles size={16} aria-hidden="true" />
              Generate from my ingredients
            </>
          )}
        </button>
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

      {recipe && !isGeneratingRecipe && (
        <RecipeDisplayCard
          recipe={recipe}
          substitutionChoice={substitutionChoice}
          onAcceptSubstitution={() => setSubstitutionChoice("accepted")}
          onRejectSubstitution={() => setSubstitutionChoice("rejected")}
        />
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Nutrition data from Open Food Facts (UK products). Per-meal targets: under {FAT_THRESHOLD_SAFE}g
        (safe), {FAT_THRESHOLD_SAFE}–{FAT_THRESHOLD_CAUTION}g (caution), over{" "}
        {FAT_THRESHOLD_CAUTION}g (high risk).
      </p>
    </div>
  )
}
