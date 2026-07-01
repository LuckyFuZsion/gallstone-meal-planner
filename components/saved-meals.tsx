"use client"

import { useState } from "react"
import { BookHeart, Trash2, ChefHat, Plus, CheckCircle2, ChevronDown, ChevronUp, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThresholdState } from "@/lib/nutrition"

export interface MealIngredient {
  name: string
  grams: number
  fat: number
}

export interface SavedMeal {
  id: string
  name: string
  totalFat: number
  calories: number
  savedAt: string
  ingredients: MealIngredient[]
}

export const DEFAULT_MEALS: SavedMeal[] = [
  {
    id: "oatmeal-1",
    name: "Safe Breakfast Oatmeal",
    totalFat: 1.5,
    calories: 210,
    savedAt: "2 days ago",
    ingredients: [
      { name: "Porridge oats", grams: 50, fat: 1.4 },
      { name: "Banana", grams: 100, fat: 0.1 },
      { name: "Skimmed milk", grams: 150, fat: 0.2 },
    ],
  },
  {
    id: "cod-rice-1",
    name: "Baked Cod & White Rice",
    totalFat: 2.1,
    calories: 340,
    savedAt: "5 days ago",
    ingredients: [
      { name: "Cod fillet", grams: 150, fat: 1.1 },
      { name: "White rice (cooked)", grams: 150, fat: 0.4 },
      { name: "Steamed broccoli", grams: 80, fat: 0.4 },
      { name: "Lemon juice", grams: 15, fat: 0.0 },
    ],
  },
  {
    id: "turkey-veg-1",
    name: "Turkey Breast & Steamed Veg",
    totalFat: 2.8,
    calories: 295,
    savedAt: "1 week ago",
    ingredients: [
      { name: "Turkey breast (skinless)", grams: 120, fat: 1.3 },
      { name: "Sweet potato", grams: 100, fat: 0.1 },
      { name: "Steamed broccoli", grams: 80, fat: 0.4 },
      { name: "Steamed carrots", grams: 80, fat: 0.2 },
      { name: "Low-fat yoghurt (plain)", grams: 50, fat: 0.4 },
    ],
  },
  {
    id: "banana-yoghurt-1",
    name: "Banana & Low-Fat Yoghurt",
    totalFat: 0.6,
    calories: 145,
    savedAt: "1 week ago",
    ingredients: [
      { name: "Banana", grams: 120, fat: 0.1 },
      { name: "Low-fat yoghurt (plain)", grams: 150, fat: 0.5 },
    ],
  },
]

interface SavedMealsProps {
  meals: SavedMeal[]
  onMealsChange: (meals: SavedMeal[]) => void
  onSaveCurrent: (name: string) => void
  canSave: boolean
  currentFat: number
  currentCalories?: number
  currentIngredients?: MealIngredient[]
  showSaveButton?: boolean
}

function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return savedAt

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`
}

export function SavedMeals({
  meals,
  onMealsChange,
  onSaveCurrent,
  canSave,
  currentFat,
  currentCalories = 0,
  currentIngredients = [],
  showSaveButton = true,
}: SavedMealsProps) {
  const [namingNew, setNamingNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [saved, setSaved] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function removeMeal(id: string) {
    onMealsChange(meals.filter((m) => m.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function handleSave() {
    if (!newName.trim()) return
    onSaveCurrent(newName.trim())
    const newMeal: SavedMeal = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      totalFat: currentFat,
      calories: currentCalories,
      savedAt: new Date().toISOString(),
      ingredients: currentIngredients,
    }
    onMealsChange([newMeal, ...meals])
    setSaved(newMeal.id)
    setNamingNew(false)
    setNewName("")
    setTimeout(() => setSaved(null), 2500)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function fatLabel(fat: number) {
    const state = getThresholdState(fat)
    if (state === "safe") return { label: "Safe", colour: "text-[oklch(0.4_0.13_155)]", bg: "bg-[oklch(0.9_0.08_145)]" }
    if (state === "caution") return { label: "Caution", colour: "text-[oklch(0.42_0.14_65)]", bg: "bg-[oklch(0.93_0.1_80)]" }
    return { label: "High Risk", colour: "text-[oklch(0.45_0.18_27)]", bg: "bg-[oklch(0.93_0.07_25)]" }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookHeart size={18} className="text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-foreground text-base">Saved Safe Meals</h2>
        </div>
        {showSaveButton && (
          <button
            onClick={() => {
              if (canSave) setNamingNew(true)
            }}
            disabled={!canSave}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              canSave
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            title={canSave ? "Save current combination" : "Add ingredients to save a meal"}
          >
            <Plus size={13} aria-hidden="true" />
            Save Current Meal
          </button>
        )}
      </div>

      {/* Inline naming input */}
      {namingNew && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-primary bg-[oklch(0.95_0.05_155)] px-3 py-2.5">
          <ChefHat size={16} className="text-primary shrink-0" aria-hidden="true" />
          <input
            autoFocus
            type="text"
            placeholder="Name this meal combination..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSave()
              if (e.key === "Escape") setNamingNew(false)
            }}
            className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={handleSave}
              disabled={!newName.trim()}
              className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setNamingNew(false)}
              className="rounded-lg bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meals grid */}
      {meals.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Saved meals">
          {meals.map((meal) => {
            const { label, colour, bg } = fatLabel(meal.totalFat)
            const isSaved = saved === meal.id
            const isExpanded = expandedId === meal.id
            return (
              <li
                key={meal.id}
                className={cn(
                  "group relative rounded-xl border border-border bg-secondary/50 transition-all",
                  isSaved && "ring-2 ring-primary"
                )}
              >
                {isSaved && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm z-10">
                    <CheckCircle2 size={28} className="text-primary" aria-hidden="true" />
                    <span className="ml-2 text-sm font-semibold text-primary">Saved!</span>
                  </div>
                )}

                {/* Tappable header row */}
                <button
                  onClick={() => toggleExpand(meal.id)}
                  className="w-full text-left p-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                  aria-expanded={isExpanded}
                  aria-controls={`meal-detail-${meal.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground text-pretty">{meal.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {meal.ingredients.length > 0 ? `${meal.ingredients.length} ingredients · ` : ""}
                        {meal.calories > 0 ? `${Math.round(meal.calories)} kcal · ` : ""}
                        {formatSavedAt(meal.savedAt)}
                      </p>
                    </div>
                    <div
                      className="shrink-0 text-muted-foreground mt-0.5"
                      aria-hidden="true"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", bg, colour)}>
                      {meal.totalFat.toFixed(1)}g fat
                    </span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", bg, colour)}>
                      {label}
                    </span>
                  </div>
                </button>

                {/* Expandable ingredient detail */}
                {isExpanded && (
                  <div
                    id={`meal-detail-${meal.id}`}
                    className="border-t border-border px-3.5 pb-3.5 pt-3 space-y-2"
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Ingredients
                    </p>
                    {meal.ingredients.length > 0 ? (
                      <ul className="space-y-1.5">
                        {meal.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-foreground">{ing.name}</span>
                            <span className="text-muted-foreground text-xs shrink-0">
                              {ing.grams}g
                            </span>
                            <span className={cn(
                              "text-xs font-semibold shrink-0",
                              ing.fat < 1 ? "text-[oklch(0.4_0.13_155)]" :
                              ing.fat < 3 ? "text-[oklch(0.42_0.14_65)]" :
                              "text-[oklch(0.45_0.18_27)]"
                            )}>
                              {ing.fat.toFixed(1)}g fat
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No ingredient details saved.</p>
                    )}

                    {/* Totals row */}
                    {meal.ingredients.length > 0 && (
                      <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Flame size={13} className="text-primary" aria-hidden="true" />
                          <span className="text-xs font-semibold text-foreground">Total</span>
                        </div>
                        <span className={cn("text-sm font-bold", colour)}>
                          {meal.totalFat.toFixed(1)}g fat
                        </span>
                      </div>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => removeMeal(meal.id)}
                      className="mt-1 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                      aria-label={`Remove ${meal.name}`}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Remove meal
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 py-8">
          <BookHeart size={24} className="text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No saved meals yet</p>
        </div>
      )}
    </div>
  )
}
