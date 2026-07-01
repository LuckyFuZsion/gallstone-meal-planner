"use client"

import { useState, useMemo, useEffect } from "react"
import { Info, ShieldAlert, RotateCcw } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { DashboardOverview } from "@/components/dashboard-overview"
import { FatTrackerCard } from "@/components/fat-tracker-card"
import { MealCreator, type SelectedIngredient } from "@/components/meal-creator"
import { SavedMeals, DEFAULT_MEALS, type MealIngredient, type SavedMeal } from "@/components/saved-meals"
import { MealPortionSelector } from "@/components/meal-portion-selector"
import {
  applyPortionToTotals,
  computeItemNutrition,
  computeMealTotals,
  FAT_THRESHOLD_CAUTION,
  FAT_THRESHOLD_SAFE,
  resolvePortionPercent,
  type PortionPreset,
} from "@/lib/nutrition"
import {
  clearMealDraft,
  DEFAULT_TRIGGER_FOODS,
  loadMealDraft,
  loadSavedMeals,
  loadTriggerFoods,
  saveMealDraft,
  saveSavedMeals,
  saveTriggerFoods,
} from "@/lib/app-storage"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selected, setSelected] = useState<SelectedIngredient[]>([])
  const [cookingFat, setCookingFat] = useState(false)
  const [digestiveTriggers, setDigestiveTriggers] = useState(false)
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(DEFAULT_MEALS)
  const [portionPreset, setPortionPreset] = useState<PortionPreset>("whole")
  const [customPortionPercent, setCustomPortionPercent] = useState(100)
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    const storedMeals = loadSavedMeals()
    setSavedMeals(storedMeals ?? DEFAULT_MEALS)

    const draft = loadMealDraft()
    if (draft) {
      setSelected(draft.selected)
      setCookingFat(draft.cookingFat)
      setDigestiveTriggers(draft.digestiveTriggers)
      setPortionPreset(draft.portionPreset)
      setCustomPortionPercent(draft.customPortionPercent)
    }

    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    saveSavedMeals(savedMeals)
  }, [savedMeals, storageReady])

  useEffect(() => {
    if (!storageReady) return

    const isEmptyDraft =
      selected.length === 0 &&
      !cookingFat &&
      !digestiveTriggers &&
      portionPreset === "whole" &&
      customPortionPercent === 100

    if (isEmptyDraft) {
      clearMealDraft()
      return
    }

    saveMealDraft({
      selected,
      cookingFat,
      digestiveTriggers,
      portionPreset,
      customPortionPercent,
    })
  }, [
    selected,
    cookingFat,
    digestiveTriggers,
    portionPreset,
    customPortionPercent,
    storageReady,
  ])

  const portionPercent = resolvePortionPercent(portionPreset, customPortionPercent)

  const fullTotals = useMemo(
    () => computeMealTotals(selected, cookingFat),
    [selected, cookingFat]
  )

  const totals = useMemo(
    () => applyPortionToTotals(fullTotals, portionPercent),
    [fullTotals, portionPercent]
  )

  const currentIngredients: MealIngredient[] = selected.map((item) => {
    const nutrition = computeItemNutrition(item)
    return {
      name: item.name,
      grams: nutrition.effectiveGrams ?? 0,
      fat: parseFloat(nutrition.fat.toFixed(1)),
    }
  })

  function handleClearMeal() {
    setSelected([])
    setCookingFat(false)
    setDigestiveTriggers(false)
    setPortionPreset("whole")
    setCustomPortionPercent(100)
    clearMealDraft()
  }

  const portionProps = {
    preset: portionPreset,
    customPercent: customPortionPercent,
    onPresetChange: setPortionPreset,
    onCustomPercentChange: setCustomPortionPercent,
  }

  const showClearMeal = activeTab === "dashboard" || activeTab === "creator"

  const headerCopy: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Overview of your current meal and fat totals",
    },
    creator: {
      title: "Meal Creator",
      subtitle: "Search UK foods and build a gallstone-safe meal",
    },
    saved: {
      title: "Saved Safe Meals",
      subtitle: "Your trusted safe meal combinations",
    },
    settings: {
      title: "My Triggers / Settings",
      subtitle: "Manage your trigger foods and preferences",
    },
  }

  const { title, subtitle } = headerCopy[activeTab] ?? headerCopy.dashboard

  const savedMealsProps = {
    meals: savedMeals,
    onMealsChange: setSavedMeals,
    onSaveCurrent: (name: string) => console.log("Saved:", name),
    canSave: selected.length > 0,
    currentFat: totals.totalFat,
    currentCalories: totals.calories,
    currentIngredients,
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 flex-col min-w-0">
        <div className="sticky top-0 z-20 flex items-start gap-2.5 bg-[oklch(0.93_0.1_80)] border-b border-[oklch(0.80_0.11_80)] px-4 py-2.5 md:px-6">
          <ShieldAlert
            size={16}
            className="shrink-0 mt-0.5 text-[oklch(0.45_0.14_65)]"
            aria-hidden="true"
          />
          <p className="text-xs text-[oklch(0.38_0.12_65)] leading-relaxed">
            <strong>Disclaimer:</strong> This app is a nutritional tracker for low-fat management,
            not direct medical advice. Always consult your gastroenterologist.
          </p>
        </div>

        <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 border-b border-border bg-card/60 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-semibold text-foreground text-balance">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {showClearMeal && (
            <button
              onClick={handleClearMeal}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              title="Clear current meal"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Clear Meal
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 pb-24 md:pb-6">
          {activeTab === "dashboard" && (
            <DashboardOverview
              totals={totals}
              fullTotals={fullTotals}
              portionPercent={portionPercent}
              portionProps={portionProps}
              selected={selected}
              cookingFat={cookingFat}
              recentMeals={savedMeals}
              onGoToCreator={() => setActiveTab("creator")}
              onGoToSaved={() => setActiveTab("saved")}
            />
          )}

          {activeTab === "creator" && (
            <div className="mx-auto max-w-5xl space-y-5">
              <div className="flex items-start gap-2 rounded-xl bg-[oklch(0.94_0.04_155)] border border-[oklch(0.82_0.08_155)] px-4 py-3">
                <Info size={15} className="shrink-0 mt-0.5 text-primary" aria-hidden="true" />
                <p className="text-xs text-foreground leading-relaxed">
                  Search and add ingredients below. Keep each meal under{" "}
                  <strong className="text-[oklch(0.4_0.13_155)]">{FAT_THRESHOLD_SAFE}g total fat</strong>{" "}
                  for lowest risk, or under{" "}
                  <strong className="text-[oklch(0.45_0.18_27)]">{FAT_THRESHOLD_CAUTION}g</strong> to
                  avoid triggering a gallbladder contraction.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <MealCreator
                    selected={selected}
                    cookingFat={cookingFat}
                    digestiveTriggers={digestiveTriggers}
                    onSelectedChange={setSelected}
                    onCookingFatChange={setCookingFat}
                    onDigestiveTriggersChange={setDigestiveTriggers}
                  />
                </div>
                <div className="lg:col-span-1 space-y-5">
                  <MealPortionSelector {...portionProps} />
                  <FatTrackerCard
                    totals={totals}
                    fullTotals={fullTotals}
                    portionPercent={portionPercent}
                  />
                </div>
              </div>

              <SavedMeals {...savedMealsProps} />
            </div>
          )}

          {activeTab === "saved" && (
            <div className="mx-auto max-w-3xl">
              <SavedMeals {...savedMealsProps} />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="mx-auto max-w-xl space-y-4">
              <SettingsPlaceholder />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function SettingsPlaceholder() {
  const [triggerFoods, setTriggerFoods] = useState<string[]>(DEFAULT_TRIGGER_FOODS)
  const [input, setInput] = useState("")
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    setTriggerFoods(loadTriggerFoods())
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    saveTriggerFoods(triggerFoods)
  }, [triggerFoods, storageReady])

  function addTrigger() {
    if (input.trim() && !triggerFoods.includes(input.trim())) {
      setTriggerFoods([...triggerFoods, input.trim()])
      setInput("")
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-foreground">My Trigger Foods</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Record foods that have previously triggered a biliary colic episode so you can avoid them.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a trigger food..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) addTrigger()
          }}
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={addTrigger}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add
        </button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {triggerFoods.map((food) => (
          <li key={food}>
            <button
              onClick={() => setTriggerFoods(triggerFoods.filter((f) => f !== food))}
              className="flex items-center gap-1.5 rounded-full bg-[oklch(0.93_0.07_25)] px-3 py-1 text-xs font-medium text-[oklch(0.45_0.18_27)] hover:bg-[oklch(0.88_0.1_25)] transition-colors"
              aria-label={`Remove ${food} from triggers`}
            >
              {food}
              <span aria-hidden="true">&times;</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">Click a trigger food chip to remove it.</p>
    </div>
  )
}
