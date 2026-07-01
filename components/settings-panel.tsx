"use client"

import { useEffect, useState } from "react"
import { BookOpen, User } from "lucide-react"
import {
  DEFAULT_TRIGGER_FOODS,
  loadTriggerFoods,
  saveTriggerFoods,
  saveUserName,
} from "@/lib/app-storage"
import { FAT_THRESHOLD_CAUTION, FAT_THRESHOLD_SAFE } from "@/lib/nutrition"

interface SettingsPanelProps {
  userName: string
  onUserNameChange: (name: string) => void
}

export function SettingsPanel({ userName, onUserNameChange }: SettingsPanelProps) {
  const [nameInput, setNameInput] = useState(userName)
  const [nameSaved, setNameSaved] = useState(false)
  const [triggerFoods, setTriggerFoods] = useState<string[]>(DEFAULT_TRIGGER_FOODS)
  const [triggerInput, setTriggerInput] = useState("")
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    setNameInput(userName)
  }, [userName])

  useEffect(() => {
    setTriggerFoods(loadTriggerFoods())
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    saveTriggerFoods(triggerFoods)
  }, [triggerFoods, storageReady])

  function saveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    saveUserName(trimmed)
    onUserNameChange(trimmed)
    setNameSaved(true)
    window.setTimeout(() => setNameSaved(false), 2000)
  }

  function addTrigger() {
    if (triggerInput.trim() && !triggerFoods.includes(triggerInput.trim())) {
      setTriggerFoods([...triggerFoods, triggerInput.trim()])
      setTriggerInput("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User size={18} className="text-primary shrink-0" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">Your Profile</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your name is used to personalise greetings across the app. You can change it anytime.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) saveName()
            }}
            placeholder="Your name"
            autoComplete="given-name"
            maxLength={40}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={saveName}
            disabled={!nameInput.trim() || nameInput.trim() === userName}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
        {nameSaved && (
          <p className="text-xs text-[oklch(0.4_0.13_155)]">Name updated.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary shrink-0" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">How to Use GallSafe</h2>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-sm">Dashboard</h3>
            <p>
              See your current meal, fat totals, and portion size at a glance. Use{" "}
              <strong className="text-foreground">Build Meal</strong> to add ingredients in the
              Meal Creator.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-sm">Meal Creator</h3>
            <p>
              Search UK supermarket products, add them to your meal, and set serving sizes. Aim
              for under <strong className="text-foreground">{FAT_THRESHOLD_SAFE}g total fat</strong>{" "}
              per meal (safest), or under{" "}
              <strong className="text-foreground">{FAT_THRESHOLD_CAUTION}g</strong> to reduce the
              risk of triggering a gallbladder contraction. Use{" "}
              <strong className="text-foreground">Generate from my ingredients</strong> for an AI
              recipe based on what you have added.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-sm">Random Meal Ideas</h3>
            <p>
              Open the <strong className="text-foreground">Random Meal Ideas</strong> page in the
              sidebar for inspiration without adding ingredients. Pick breakfast, lunch, tea, or a
              snack and the AI will suggest a low-fat recipe. Choose your preferred cooking method
              before generating.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-sm">Saved Safe Meals</h3>
            <p>
              Save meal combinations you trust so you can reuse them quickly. Saved meals appear
              on the Dashboard and in the Saved Meals tab.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-sm">Trigger Foods</h3>
            <p>
              Record foods that have caused problems for you below. Keep this list handy when
              planning meals and reviewing ingredients.
            </p>
          </section>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">My Trigger Foods</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Record foods that have previously triggered a biliary colic episode so you can avoid
          them.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a trigger food..."
            value={triggerInput}
            onChange={(e) => setTriggerInput(e.target.value)}
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
    </div>
  )
}
